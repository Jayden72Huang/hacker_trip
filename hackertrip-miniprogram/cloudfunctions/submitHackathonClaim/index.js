// 云函数：提交赛事认领申请。
// 安全边界：必须先通过组织者认证；认领只进入 hackathon_claims，后台审核通过后才绑定赛事归属。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanText(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 500);
}

function normalizeForm(form) {
  const source = form && typeof form === 'object' ? form : {};
  return {
    eventId: cleanText(source.eventId || source.id, 120),
    eventName: cleanText(source.eventName || source.name, 120),
    claimRole: cleanText(source.claimRole, 80),
    contact: cleanText(source.contact, 160),
    proofUrl: cleanText(source.proofUrl || source.website, 300),
    note: cleanText(source.note, 1000),
  };
}

function buildSecurityText(form, organizer) {
  return [
    form.eventName,
    form.claimRole,
    form.contact,
    form.proofUrl,
    form.note,
    organizer && organizer.orgName,
  ].filter(Boolean).join('\n').slice(0, 2500);
}

async function getApprovedOrganizer(openid) {
  const res = await db.collection('organizer_applications')
    .where({ openid, status: 'approved' })
    .limit(1)
    .get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function getHackathon(eventId) {
  const id = cleanText(eventId, 120);
  if (!id) return null;
  const res = await db.collection('hackathons').where({ id }).limit(1).get();
  if (res.data && res.data[0]) return res.data[0];
  try {
    const doc = await db.collection('hackathons').doc(id).get();
    return doc && doc.data ? doc.data : null;
  } catch (e) {
    return null;
  }
}

function publicEventFields(eventDoc, eventId) {
  const event = eventDoc || {};
  return {
    eventId: event.id || eventId || '',
    eventDocId: event._id || '',
    eventName: event.name || event.shortName || '',
    eventCity: event.city || event.location || '',
    eventStartDate: event.startDate || '',
    eventEndDate: event.endDate || '',
    eventWebsite: event.website || '',
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext() || {};
  const openid = wxContext.OPENID;
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };

  const form = normalizeForm((event || {}).form || event);
  if (!form.eventId) return { ok: false, code: 'NO_EVENT', message: '缺少赛事 ID' };
  if (!form.claimRole || !form.contact || !form.note) {
    return { ok: false, code: 'INVALID_FORM', message: '请填写你的身份、联系方式和认领说明' };
  }

  let organizer = null;
  try {
    organizer = await getApprovedOrganizer(openid);
  } catch (e) {
    return { ok: false, code: 'ORGANIZER_CHECK_FAILED', message: String(e) };
  }
  if (!organizer) return { ok: false, code: 'NOT_ORGANIZER', message: '需先通过组织者认证后再认领赛事' };

  const eventDoc = await getHackathon(form.eventId);
  if (!eventDoc) return { ok: false, code: 'EVENT_NOT_FOUND', message: '赛事不存在或已下线' };
  if (eventDoc.organizerOpenid && eventDoc.organizerOpenid !== openid) {
    return { ok: false, code: 'EVENT_ALREADY_CLAIMED', message: '该赛事已被其他组织者认领' };
  }

  let security = null;
  try {
    security = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: 1,
      version: 2,
      content: buildSecurityText(form, organizer),
      title: form.eventName || eventDoc.name || '赛事认领',
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
      message: '认领说明未通过安全检测，请修改后重试',
      security: { suggest, label, traceId: security.trace_id },
    };
  }

  const now = Date.now();
  const status = suggest === 'review' ? 'security_review' : 'pending';
  const data = Object.assign({}, publicEventFields(eventDoc, form.eventId), form, {
    eventName: form.eventName || eventDoc.name || eventDoc.shortName || '',
    openid,
    organizerId: organizer._id || '',
    organizerName: organizer.orgName || '',
    organizerRole: organizer.role || '',
    organizerContact: organizer.contact || '',
    status,
    securityStatus: suggest === 'review' ? 'review' : 'pass',
    securityResult: security.result || null,
    securityTraceId: security.trace_id || '',
    submittedAt: now,
    updatedAt: now,
    reviewedAt: 0,
  });

  try {
    const col = db.collection('hackathon_claims');
    const existing = await col.where({ openid, eventId: data.eventId }).limit(1).get();
    if (existing.data && existing.data[0]) {
      if (existing.data[0].status === 'approved') {
        return { ok: true, id: existing.data[0]._id, status: 'approved', alreadyApproved: true };
      }
      await col.doc(existing.data[0]._id).update({ data });
      return { ok: true, id: existing.data[0]._id, status, security: { suggest: suggest || 'pass', label: label || 100 } };
    }
    const saved = await col.add({ data });
    return { ok: true, id: saved._id, status, security: { suggest: suggest || 'pass', label: label || 100 } };
  } catch (e) {
    return { ok: false, code: 'CLAIM_SAVE_FAILED', message: String(e) };
  }
};
