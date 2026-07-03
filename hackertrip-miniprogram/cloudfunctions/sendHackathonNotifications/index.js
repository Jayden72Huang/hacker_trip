// 云函数：发送黑客松订阅消息。
// 仅管理员/后台调用。模板字段由微信后台模板决定，可通过 event.data 显式传入。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const TEMPLATE_ENV = {
  new_hackathon: 'NEW_HACKATHON_TEMPLATE_ID',
  smart_recommendation: 'SMART_RECOMMENDATION_TEMPLATE_ID',
  deadline_reminder: 'DEADLINE_REMINDER_TEMPLATE_ID',
};

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength || 200);
}

async function isAdmin(openid) {
  if (!openid) return false;
  const envAdmins = String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (envAdmins.indexOf(openid) !== -1) return true;

  try {
    const admins = await db.collection('admin_users')
      .where({ openid, active: _.neq(false) })
      .limit(1)
      .get();
    return !!(admins.data && admins.data[0]);
  } catch (e) {
    return false;
  }
}

function templateIdFor(type, event) {
  const fromEvent = cleanText(event && event.templateId, 120);
  if (fromEvent) return fromEvent;
  const key = TEMPLATE_ENV[type];
  return key ? cleanText(process.env[key], 120) : '';
}

function defaultPage(event) {
  const hackathonId = cleanText(event && event.hackathonId, 100);
  if (hackathonId) return `/pages/detail/detail?id=${encodeURIComponent(hackathonId)}`;
  return '/pages/index/index';
}

// time 类型字段必须是合法时间格式，非法值(如"待定")会被微信判 47003，兜底为今天日期
function safeTime(value) {
  const s = cleanText(value, 20);
  if (/\d{4}[-/年]\s?\d{1,2}/.test(s)) return s;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 字段名/类型必须与微信后台模板逐一对应，否则发送 47003。三个模板字段：
//   new_hackathon(新活动提醒 OGH7):       thing1 活动名称 / time2 开始时间 / time4 活动时间 / thing3 温馨提示
//   smart_recommendation(订阅资讯更新 QlPV): thing1 资讯名称 / time2 发布时间 / thing4 项目名称 / thing3 温馨提示
//   deadline_reminder(活动动态通知 7eqO):   thing1 活动名称 / thing5 活动机构 / time3 截止时间 / phrase2 活动进度 / thing4 温馨提示
function defaultData(type, event) {
  const hackathon = event && event.hackathon && typeof event.hackathon === 'object' ? event.hackathon : {};
  const title = cleanText(event.title || hackathon.shortName || hackathon.name || 'HackerTrip 黑客松', 20);
  const note = cleanText(event.note || hackathon.summary || '打开 HackerTrip 查看详情', 20);
  const start = safeTime(event.startTime || hackathon.startDate);

  if (type === 'deadline_reminder') {
    return {
      thing1: { value: title },
      thing5: { value: cleanText(event.organizer || hackathon.organizerName || hackathon.organizer || 'HackerTrip', 20) },
      time3: { value: safeTime(event.deadline || hackathon.registrationDeadline || hackathon.startDate) },
      phrase2: { value: cleanText(event.progress || '报名中', 5) },
      thing4: { value: note },
    };
  }
  if (type === 'smart_recommendation') {
    return {
      thing1: { value: title },
      time2: { value: safeTime(event.publishTime || hackathon.startDate) },
      thing4: { value: cleanText(event.project || hackathon.name || title, 20) },
      thing3: { value: note },
    };
  }
  // 默认 new_hackathon
  return {
    thing1: { value: title },
    time2: { value: start },
    time4: { value: safeTime(event.eventTime || hackathon.startDate) },
    thing3: { value: note },
  };
}

function maskOpenid(openid) {
  const value = cleanText(openid, 80);
  if (value.length <= 12) return value ? `${value.slice(0, 3)}***` : '';
  return `${value.slice(0, 8)}***${value.slice(-4)}`;
}

async function listSubscribers(type, templateId, limit) {
  const res = await db.collection('message_subscriptions')
    .where({ type, templateId, status: 'accept' })
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();
  return res.data || [];
}

async function logSend(type, item, payload, result) {
  const now = Date.now();
  await db.collection('notification_logs').add({
    data: {
      openid: item.openid,
      type,
      templateId: item.templateId,
      page: payload.page,
      ok: !!result.ok,
      errCode: result.errCode || '',
      errMsg: result.errMsg || '',
      createdAt: now,
    },
  }).catch(() => {});
  await db.collection('message_subscriptions').doc(item._id).update({
    data: {
      lastSentAt: now,
      lastSendOk: !!result.ok,
      lastSendErrMsg: result.errMsg || '',
    },
  }).catch(() => {});
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  const allowed = await isAdmin(openid);
  if (!allowed) return { ok: false, code: 'FORBIDDEN', message: '仅管理员可发送订阅消息' };

  const action = cleanText((event && event.action) || 'preview', 30);
  const type = cleanText((event && event.type) || 'new_hackathon', 60);
  const templateId = templateIdFor(type, event || {});
  if (!templateId) return { ok: false, code: 'TEMPLATE_NOT_CONFIGURED', message: '缺少订阅消息模板 ID' };

  const limit = Math.min(Math.max(Number(event && event.limit) || 50, 1), 200);
  const subscribers = await listSubscribers(type, templateId, limit);
  if (action === 'preview') {
    return {
      ok: true,
      action,
      type,
      templateId,
      count: subscribers.length,
      subscribers: subscribers.slice(0, 20).map((item) => ({
        type: item.type,
        status: item.status,
        openid: maskOpenid(item.openid),
        updatedAt: item.updatedAt || 0,
      })),
    };
  }

  if (action !== 'send') return { ok: false, code: 'UNKNOWN_ACTION', message: '未知动作' };

  const page = cleanText(event && event.page, 180) || defaultPage(event || {});
  const payload = {
    templateId,
    page,
    data: event && event.data && typeof event.data === 'object' ? event.data : defaultData(type, event || {}),
    miniprogramState: cleanText(event && event.miniprogramState, 20) || 'formal',
  };

  const results = [];
  for (const item of subscribers) {
    try {
      const sendRes = await cloud.openapi.subscribeMessage.send({
        touser: item.openid,
        templateId: payload.templateId,
        page: payload.page,
        data: payload.data,
        miniprogramState: payload.miniprogramState,
      });
      const result = { ok: true, errMsg: sendRes.errMsg || '' };
      results.push(Object.assign({ openid: maskOpenid(item.openid) }, result));
      await logSend(type, item, payload, result);
    } catch (e) {
      const result = {
        ok: false,
        errCode: e && e.errCode ? e.errCode : '',
        errMsg: String(e && e.errMsg ? e.errMsg : (e && e.message ? e.message : e)),
      };
      results.push(Object.assign({ openid: maskOpenid(item.openid) }, result));
      await logSend(type, item, payload, result);
    }
  }

  return {
    ok: true,
    action,
    type,
    templateId,
    count: subscribers.length,
    sent: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    results,
  };
};
