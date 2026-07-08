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

// 与 miniprogram/env.js subscribeTemplates 保持一致；env 变量可覆盖
const DEFAULT_TEMPLATES = {
  new_hackathon: 'OGH7Fhna7wcRgOLkEfDcFiBk78In5MM7Ch6SBX5LTRg',
  smart_recommendation: 'QlPVQ62U_JPoslrAvsKzGVtjQoUbgPY-9e_NzTPztvA',
  deadline_reminder: '7eqO_KPQ0NtrGFvztJNvfn01GXWV5R3tHeTUJLIrF44',
};

// 定时扫描窗口：报名截止前 N 天内的赛事触发提醒
const DEADLINE_WINDOW_DAYS = 3;

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
  const fromEnv = key ? cleanText(process.env[key], 120) : '';
  return fromEnv || DEFAULT_TEMPLATES[type] || '';
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

async function logSend(type, item, payload, result, hackathonId) {
  const now = Date.now();
  await db.collection('notification_logs').add({
    data: {
      openid: item.openid,
      type,
      templateId: item.templateId,
      page: payload.page,
      hackathonId: cleanText(hackathonId, 100),
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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dateStr(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

async function sendDeadlineReminder(sub, hackathon, page) {
  const payload = {
    templateId: sub.templateId,
    page,
    data: defaultData('deadline_reminder', { hackathon }),
    miniprogramState: cleanText(process.env.MINIPROGRAM_STATE, 20) || 'formal',
  };
  try {
    const sendRes = await cloud.openapi.subscribeMessage.send({
      touser: sub.openid,
      templateId: payload.templateId,
      page: payload.page,
      data: payload.data,
      miniprogramState: payload.miniprogramState,
    });
    const result = { ok: true, errMsg: sendRes.errMsg || '' };
    await logSend('deadline_reminder', sub, payload, result, hackathon.id);
    return result;
  } catch (e) {
    const errCode = e && e.errCode ? e.errCode : '';
    const result = {
      ok: false,
      errCode,
      errMsg: String(e && e.errMsg ? e.errMsg : (e && e.message ? e.message : e)),
    };
    await logSend('deadline_reminder', sub, payload, result, hackathon.id);
    // 43101 = 用户拒收/一次性配额用尽：标记等待下次收藏时重新授权
    if (String(errCode) === '43101') {
      await db.collection('message_subscriptions').doc(sub._id).update({
        data: { status: 'exhausted', exhaustedAt: Date.now() },
      }).catch(() => {});
    }
    return result;
  }
}

// 定时触发：扫描临近报名截止的赛事，向「收藏了该赛事 + 授权过截止提醒」的用户精准发送。
// 通过 notification_logs 去重，同一用户同一赛事只提醒一次。
async function runDeadlineScan() {
  const templateId = templateIdFor('deadline_reminder', {});
  if (!templateId) return { ok: false, code: 'TEMPLATE_NOT_CONFIGURED' };

  const today = new Date(Date.now() + 8 * 3600 * 1000); // 云函数为 UTC，换算北京时间
  const from = dateStr(today);
  const until = dateStr(new Date(today.getTime() + DEADLINE_WINDOW_DAYS * 86400000));

  const hackathons = (await db.collection('hackathons')
    .where({
      isPublished: _.neq(false),
      registrationDeadline: _.gte(from).and(_.lte(until)),
    })
    .limit(50)
    .get()).data || [];
  if (!hackathons.length) return { ok: true, scanned: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const hackathon of hackathons) {
    const hid = hackathon.id || hackathon._id;
    const bookmarks = (await db.collection('bookmarks')
      .where({ hackathonId: hid })
      .limit(500)
      .get()).data || [];
    if (!bookmarks.length) continue;
    const openids = bookmarks.map((b) => b.openid).filter(Boolean);

    const subs = (await db.collection('message_subscriptions')
      .where({
        type: 'deadline_reminder',
        templateId,
        status: 'accept',
        openid: _.in(openids.slice(0, 500)),
      })
      .limit(500)
      .get()).data || [];

    const page = `/pages/detail/detail?id=${encodeURIComponent(hid)}`;
    for (const sub of subs) {
      const already = await db.collection('notification_logs')
        .where({ openid: sub.openid, type: 'deadline_reminder', hackathonId: hid, ok: true })
        .limit(1)
        .get();
      if (already.data && already.data[0]) { skipped += 1; continue; }
      const result = await sendDeadlineReminder(sub, Object.assign({ id: hid }, hackathon), page);
      if (result.ok) sent += 1; else failed += 1;
    }
  }
  return { ok: true, scanned: hackathons.length, sent, failed, skipped };
}

function isTimerEvent(event) {
  return !!(event && (event.Type === 'Timer' || event.TriggerName));
}

exports.main = async (event) => {
  // 定时触发器：无用户上下文，走截止提醒自动扫描
  if (isTimerEvent(event)) {
    try {
      const res = await runDeadlineScan();
      console.log('[deadline-scan]', JSON.stringify(res));
      return res;
    } catch (e) {
      console.error('[deadline-scan] failed', e);
      return { ok: false, code: 'SCAN_FAILED', message: String(e && e.message ? e.message : e) };
    }
  }

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
      await logSend(type, item, payload, result, event && event.hackathonId);
    } catch (e) {
      const result = {
        ok: false,
        errCode: e && e.errCode ? e.errCode : '',
        errMsg: String(e && e.errMsg ? e.errMsg : (e && e.message ? e.message : e)),
      };
      results.push(Object.assign({ openid: maskOpenid(item.openid) }, result));
      await logSend(type, item, payload, result, event && event.hackathonId);
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
