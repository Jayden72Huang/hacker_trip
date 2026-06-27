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

function defaultData(type, event) {
  const hackathon = event && event.hackathon && typeof event.hackathon === 'object' ? event.hackathon : {};
  const title = cleanText(event.title || hackathon.shortName || hackathon.name || 'HackerTrip 黑客松', 20);
  const note = cleanText(event.note || hackathon.summary || '打开 HackerTrip 查看详情', 20);
  if (type === 'deadline_reminder') {
    return {
      thing1: { value: title },
      time2: { value: cleanText(event.deadline || hackathon.registrationDeadline || hackathon.startDate || '待确认', 20) },
      thing3: { value: note },
    };
  }
  return {
    thing1: { value: title },
    thing2: { value: cleanText(hackathon.location || hackathon.city || event.location || '待确认', 20) },
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
