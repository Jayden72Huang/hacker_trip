// 云函数：提交组织者认证申请。
// 安全边界：申请内容先过微信文本安全检测，再写入 organizer_applications 等待后台审核。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength || 500);
}

function normalizeForm(form) {
  const source = form && typeof form === 'object' ? form : {};
  return {
    orgName: cleanText(source.orgName, 80),
    role: cleanText(source.role, 80),
    contact: cleanText(source.contact, 160),
    website: cleanText(source.website, 300),
    note: cleanText(source.note, 1000),
  };
}

function buildSecurityText(form) {
  return [form.orgName, form.role, form.contact, form.website, form.note]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2500);
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext() || {};
  const openid = wxContext.OPENID;
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };

  const form = normalizeForm((event || {}).form || event);
  if (!form.orgName || !form.role || !form.contact) {
    return { ok: false, code: 'INVALID_FORM', message: '请填写机构、身份和联系方式' };
  }

  let security = null;
  try {
    security = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: 1,
      version: 2,
      content: buildSecurityText(form),
      title: form.orgName,
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
      message: '申请内容未通过安全检测，请修改后重试',
      security: { suggest, label, traceId: security.trace_id },
    };
  }

  const now = Date.now();
  const data = Object.assign({}, form, {
    openid,
    status: 'pending',
    securityStatus: suggest === 'review' ? 'review' : 'pass',
    securityResult: security.result || null,
    securityTraceId: security.trace_id || '',
    approvalSource: 'server',
    submittedAt: now,
    updatedAt: now,
    reviewedAt: 0,
  });

  try {
    const col = db.collection('organizer_applications');
    const existing = await col.where({ openid }).limit(1).get();
    if (existing.data && existing.data[0]) {
      await col.doc(existing.data[0]._id).update({ data });
      return { ok: true, id: existing.data[0]._id, status: 'pending', security: { suggest: suggest || 'pass', label: label || 100 } };
    }
    const saved = await col.add({ data });
    return { ok: true, id: saved._id, status: 'pending', security: { suggest: suggest || 'pass', label: label || 100 } };
  } catch (e) {
    return { ok: false, code: 'APPLICATION_SAVE_FAILED', message: String(e) };
  }
};
