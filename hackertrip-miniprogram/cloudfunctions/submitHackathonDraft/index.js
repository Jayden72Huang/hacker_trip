// 云函数：组织者提交黑客松草稿。
// 安全边界：校验服务端组织者身份，调用微信内容安全，草稿只进 hackathon_drafts，不直接公开。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const REQUIRED_FIELDS = ['name', 'city', 'startDate', 'endDate', 'website'];
const TEXT_FIELDS = [
  'name',
  'city',
  'mode',
  'startDate',
  'endDate',
  'prizePool',
  'tracks',
  'website',
  'summary',
];

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength || 500);
}

function normalizeForm(form) {
  const source = form && typeof form === 'object' ? form : {};
  return {
    name: cleanText(source.name, 80),
    city: cleanText(source.city, 40),
    mode: ['offline', 'online', 'hybrid'].indexOf(source.mode) !== -1 ? source.mode : 'offline',
    startDate: cleanText(source.startDate, 20),
    endDate: cleanText(source.endDate, 20),
    prizePool: cleanText(source.prizePool, 120),
    tracks: cleanText(source.tracks, 160),
    website: cleanText(source.website, 300),
    summary: cleanText(source.summary, 1000),
  };
}

function buildSecurityText(form) {
  return TEXT_FIELDS
    .map((field) => form[field])
    .filter(Boolean)
    .join('\n')
    .slice(0, 2500);
}

async function getApprovedOrganizer(openid) {
  const res = await db.collection('organizer_applications')
    .where({ openid, status: 'approved' })
    .limit(1)
    .get();
  return res.data && res.data[0] ? res.data[0] : null;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext() || {};
  const openid = wxContext.OPENID;
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };

  const form = normalizeForm((event || {}).form || event);
  const missing = REQUIRED_FIELDS.filter((field) => !form[field]);
  if (missing.length) {
    return { ok: false, code: 'INVALID_FORM', message: '请补全名称、城市、时间和官网', missing };
  }

  let organizer = null;
  try {
    organizer = await getApprovedOrganizer(openid);
  } catch (e) {
    return { ok: false, code: 'ORGANIZER_CHECK_FAILED', message: String(e) };
  }
  if (!organizer) {
    return { ok: false, code: 'NOT_ORGANIZER', message: '需先通过组织者认证' };
  }

  let security = null;
  try {
    security = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: 3,
      version: 2,
      content: buildSecurityText(form),
    });
  } catch (e) {
    return { ok: false, code: 'SECURITY_CHECK_FAILED', message: String(e) };
  }

  const suggest = security && security.result && security.result.suggest;
  const label = security && security.result && security.result.label;
  if (security.errcode && security.errcode !== 0) {
    return {
      ok: false,
      code: 'SECURITY_CHECK_FAILED',
      message: security.errmsg || '内容安全检测失败',
      security: { errcode: security.errcode, errmsg: security.errmsg },
    };
  }
  if (suggest === 'risky') {
    return {
      ok: false,
      code: 'CONTENT_RISKY',
      message: '内容未通过安全检测，请修改后重试',
      security: { suggest, label, traceId: security.trace_id },
    };
  }

  const now = Date.now();
  const status = suggest === 'review' ? 'security_review' : 'pending_manual_review';
  const draft = Object.assign({}, form, {
    openid,
    organizerId: organizer._id || '',
    organizerName: organizer.orgName || '',
    status,
    securityResult: security.result || null,
    securityTraceId: security.trace_id || '',
    submittedAt: now,
    updatedAt: now,
  });

  try {
    const saved = await db.collection('hackathon_drafts').add({ data: draft });
    return {
      ok: true,
      id: saved._id,
      status,
      security: { suggest: suggest || 'pass', label: label || 100, traceId: security.trace_id || '' },
    };
  } catch (e) {
    return { ok: false, code: 'DRAFT_SAVE_FAILED', message: String(e) };
  }
};
