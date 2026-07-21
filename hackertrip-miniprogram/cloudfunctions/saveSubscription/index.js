// 云函数：保存微信订阅消息授权结果。
// 前端只能触发授权弹窗；服务端按 openid 记录 accept/reject，供后台发送函数筛选。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const VALID_TYPES = ['new_hackathon', 'smart_recommendation', 'deadline_reminder', 'audit_result'];
const VALID_STATUS = ['accept', 'reject', 'ban', 'filter', 'unknown'];

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength || 200);
}

function normalizeRecord(item) {
  const type = cleanText(item && item.type, 60);
  const templateId = cleanText(item && item.templateId, 120);
  const status = cleanText(item && item.status, 30) || 'unknown';
  if (VALID_TYPES.indexOf(type) === -1 || !templateId) return null;
  return {
    type,
    label: cleanText(item.label, 60),
    templateId,
    status: VALID_STATUS.indexOf(status) !== -1 ? status : 'unknown',
  };
}

async function upsertSubscription(openid, record, source, preferences) {
  const now = Date.now();
  const col = db.collection('message_subscriptions');
  const patch = {
    openid,
    type: record.type,
    label: record.label,
    templateId: record.templateId,
    status: record.status,
    source,
    preferences,
    updatedAt: now,
  };
  if (record.status === 'accept') patch.acceptedAt = now;
  if (record.status !== 'accept') patch.rejectedAt = now;

  const existed = await col.where({ openid, type: record.type }).limit(1).get();
  if (existed.data && existed.data[0]) {
    await col.doc(existed.data[0]._id).update({ data: patch });
    return Object.assign({ _id: existed.data[0]._id }, patch);
  }

  const added = await col.add({ data: Object.assign({ createdAt: now }, patch) });
  return Object.assign({ _id: added._id }, patch);
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };

  const source = cleanText(event && event.source, 80) || 'unknown';
  const preferences = event && event.preferences && typeof event.preferences === 'object'
    ? event.preferences
    : {};
  const records = Array.isArray(event && event.records)
    ? event.records.map(normalizeRecord).filter(Boolean)
    : [];
  if (!records.length) return { ok: false, code: 'EMPTY_RECORDS', message: '缺少订阅记录' };

  try {
    const saved = [];
    for (const record of records) {
      saved.push(await upsertSubscription(openid, record, source, preferences));
    }
    return {
      ok: true,
      saved,
      acceptedTypes: saved.filter((item) => item.status === 'accept').map((item) => item.type),
      rejectedTypes: saved.filter((item) => item.status !== 'accept').map((item) => item.type),
    };
  } catch (e) {
    console.error('[saveSubscription] failed', e);
    return { ok: false, code: 'SAVE_FAILED', message: String(e && e.message ? e.message : e) };
  }
};
