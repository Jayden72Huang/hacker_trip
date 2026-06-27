// 云函数：主办方活动提交（外部 CLI / HTTP 触发器入口）。
//   action='submit' —— 主办方通过 CLI 提交活动信息，写入 hackathon_drafts 草稿箱。
//
// 安全边界（防垃圾 + 绑账号 + 格式校验）：
//   1) 必须带 pairCode + uploadToken：主办方先在小程序「主办方后台」生成配对码(pairSync create)，
//      eventSync 校验 sync_pairs(code+token+未过期+有 openid)，把赛事绑定到主办方 openid。取消匿名入口。
//   2) 必填齐全 + 格式硬校验（日期 YYYY-MM-DD、起止先后、官网 http(s)），不过直接拒绝、不写库。
//   3) 用主办方 openid 调微信内容安全 msgSecCheck，risky 拒绝。
//   4) 配对码一次性：提交后标记 eventBound，防重复刷。
//
// 草稿字段对齐 adminHackathonManage 的 publicDraftFields，审核通过后可直接转入 hackathons。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const REQUIRED_FIELDS = ['name', 'city', 'startDate', 'endDate', 'website'];
const RECOMMENDED_FIELDS = ['summary', 'prizePool', 'registrationDeadline', 'organizerContact', 'tracks'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAIR_RE = /^\d{6}$/;

function cleanText(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 500);
}

// 数组或逗号串 -> 清洗后的字符串数组（每项 ≤60，最多 20 个）
function splitList(value) {
  let list = [];
  if (Array.isArray(value)) {
    list = value;
  } else {
    list = String(value || '').split(/[,\n，、]/);
  }
  return list
    .map((x) => cleanText(x, 60))
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeMode(value) {
  return ['offline', 'online', 'hybrid'].indexOf(value) !== -1 ? value : 'offline';
}

function modeText(mode) {
  const map = { offline: '线下', online: '线上', hybrid: '混合' };
  return map[mode] || '线下';
}

function normalizeEvent(event) {
  const input = event || {};
  if (input.body) {
    if (typeof input.body === 'string') {
      try {
        return Object.assign({}, input, JSON.parse(input.body));
      } catch (e) {
        return input;
      }
    }
    if (typeof input.body === 'object') {
      return Object.assign({}, input, input.body);
    }
  }
  return input;
}

function getHeader(headers, name) {
  const source = headers && typeof headers === 'object' ? headers : {};
  const target = String(name || '').toLowerCase();
  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === target) return source[keys[i]];
  }
  return '';
}

function readSubmitToken(rawEvent, event) {
  const bodyToken = event && (event.submitToken || event.syncToken) ? String(event.submitToken || event.syncToken) : '';
  const headers = (rawEvent && rawEvent.headers) || (event && event.headers) || {};
  const direct = getHeader(headers, 'x-sync-token');
  const auth = getHeader(headers, 'authorization');
  if (direct) return String(direct);
  if (auth && /^Bearer\s+/i.test(String(auth))) return String(auth).replace(/^Bearer\s+/i, '').trim();
  return bodyToken;
}

// 读取活动表单（同时兼容 event.event 包裹与扁平结构）
function readForm(event) {
  const src = event && typeof event.event === 'object' ? event.event : event;
  return src && typeof src === 'object' ? src : {};
}

function normalizeForm(form) {
  const mode = normalizeMode(form.mode);
  const city = cleanText(form.city, 60);
  const country = cleanText(form.country || '中国', 40);
  const name = cleanText(form.name, 100);
  const startDate = cleanText(form.startDate, 20);
  const summary = cleanText(form.summary, 1000);
  return {
    name,
    shortName: cleanText(form.shortName || name, 40),
    city,
    country,
    location: cleanText(form.location || `${city}${city ? '，' : ''}${country}`, 120),
    mode,
    modeText: modeText(mode),
    startDate,
    endDate: cleanText(form.endDate, 20),
    registrationDeadline: cleanText(form.registrationDeadline || startDate, 20),
    prizePool: cleanText(form.prizePool, 120),
    tracks: splitList(form.tracks),
    techStack: splitList(form.techStack || form.tracks),
    tags: splitList(form.tags || form.tracks),
    website: cleanText(form.website, 300),
    summary,
    theme: cleanText(form.theme || summary || name, 160),
    cover: cleanText(form.cover, 300),
    isPast: form.isPast === true,
    organizerName: cleanText(form.organizerName, 80),
    organizerContact: cleanText(form.organizerContact, 120),
  };
}

// 必填校验（数组类字段用长度判空）
function findMissing(form) {
  return REQUIRED_FIELDS.filter((field) => {
    const v = form[field];
    if (Array.isArray(v)) return v.length === 0;
    return !v;
  });
}

function findRecommendedMissing(form) {
  return RECOMMENDED_FIELDS.filter((field) => {
    const v = form[field];
    if (Array.isArray(v)) return v.length === 0;
    return !v;
  });
}

// 格式硬校验：日期格式 / 起止先后 / 官网协议
function validateFormats(form) {
  const errors = [];
  if (!DATE_RE.test(form.startDate)) errors.push('startDate 需为 YYYY-MM-DD 格式');
  if (!DATE_RE.test(form.endDate)) errors.push('endDate 需为 YYYY-MM-DD 格式');
  if (DATE_RE.test(form.startDate) && DATE_RE.test(form.endDate) && form.startDate > form.endDate) {
    errors.push('startDate 不能晚于 endDate');
  }
  if (form.registrationDeadline && !DATE_RE.test(form.registrationDeadline)) {
    errors.push('registrationDeadline 需为 YYYY-MM-DD 格式');
  }
  if (!/^https?:\/\//i.test(form.website)) errors.push('website 需为 http(s):// 链接');
  return errors;
}

function buildSecurityText(form) {
  return [form.name, form.shortName, form.summary, form.theme, form.tracks.join(' '), form.organizerName]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2500);
}

exports.main = async (rawEvent, context) => {
  const event = normalizeEvent(rawEvent);
  const action = cleanText((event || {}).action || 'submit', 40);

  if (action !== 'submit') {
    return { ok: false, code: 'UNKNOWN_ACTION', message: '未知 action' };
  }

  // ---- 防滥用①：配对码 + token，绑定主办方小程序账号（取消匿名提交）----
  const pairCode = cleanText(event.pairCode || event.code, 10);
  const uploadToken = readSubmitToken(rawEvent, event);
  if (!PAIR_RE.test(pairCode)) {
    return { ok: false, code: 'BAD_PAIR', message: '请在小程序「主办方后台」生成 6 位提交配对码' };
  }
  if (!uploadToken) {
    return { ok: false, code: 'BAD_PAIR', message: '缺少提交凭证(uploadToken)，请在小程序生成配对码时一并获取' };
  }

  const now = Date.now();
  let pairDoc = null;
  try {
    const pairRes = await db.collection('sync_pairs').where({ code: pairCode }).limit(1).get();
    pairDoc = pairRes.data && pairRes.data[0];
  } catch (e) {
    return { ok: false, code: 'PAIR_LOOKUP_FAILED', message: String(e) };
  }
  if (!pairDoc || pairDoc.uploadToken !== uploadToken) {
    return { ok: false, code: 'BAD_PAIR', message: '配对码无效或凭证不匹配，请在小程序重新生成' };
  }
  if (pairDoc.expireAt && pairDoc.expireAt < now) {
    return { ok: false, code: 'BAD_PAIR', message: '配对码已过期，请在小程序重新生成' };
  }
  if (!pairDoc.openid) {
    return { ok: false, code: 'BAD_PAIR', message: '配对会话未绑定账号，请在小程序重新生成' };
  }
  if (pairDoc.eventBound) {
    return { ok: false, code: 'BAD_PAIR', message: '该配对码已用于提交赛事，请重新生成' };
  }
  const organizerOpenid = pairDoc.openid;

  const form = normalizeForm(readForm(event));

  // ---- 防滥用②：必填齐全 ----
  const missing = findMissing(form);
  if (missing.length) {
    return { ok: false, code: 'INVALID_FORM', message: '请补全名称、城市、起止日期和官网', missing };
  }

  // ---- 防滥用②：格式正确 ----
  const formatErrors = validateFormats(form);
  if (formatErrors.length) {
    return { ok: false, code: 'INVALID_FORMAT', message: '字段格式有误', errors: formatErrors };
  }

  // ---- 防滥用③：内容安全（用主办方 openid 做 msgSecCheck）----
  let needsSecurityReview = false;
  let securityResult = null;
  let securityTraceId = '';
  try {
    const security = await cloud.openapi.security.msgSecCheck({
      openid: organizerOpenid,
      scene: 3,
      version: 2,
      content: buildSecurityText(form),
    });
    if (security && security.errcode && security.errcode !== 0) {
      return {
        ok: false,
        code: 'SECURITY_CHECK_FAILED',
        message: security.errmsg || '内容安全检测失败',
        security: { errcode: security.errcode, errmsg: security.errmsg },
      };
    }
    const suggest = security && security.result && security.result.suggest;
    if (suggest === 'risky') {
      return {
        ok: false,
        code: 'CONTENT_RISKY',
        message: '内容未通过安全检测，请修改后重试',
        security: { suggest, label: security.result.label, traceId: security.trace_id },
      };
    }
    securityResult = (security && security.result) || null;
    securityTraceId = (security && security.trace_id) || '';
    if (suggest === 'review') needsSecurityReview = true;
  } catch (e) {
    // 内容安全调用失败不阻断提交，但标记待人工复核
    needsSecurityReview = true;
  }

  // ---- 写入草稿箱（绑定主办方 openid）----
  const recommendedMissing = findRecommendedMissing(form);
  const draft = Object.assign({}, form, {
    openid: organizerOpenid,
    organizerOpenid,
    status: 'pending_manual_review',
    source: 'organizer_cli',
    needsSecurityReview,
    securityResult,
    securityTraceId,
    admissionCheck: {
      passed: false,
      missing: recommendedMissing,
      note: '外部提交·已绑主办方账号·待人工核实',
    },
    submittedAt: now,
    updatedAt: now,
  });

  try {
    const saved = await db.collection('hackathon_drafts').add({ data: draft });
    // 配对码一次性：标记已用于赛事提交，防重复刷
    try {
      await db.collection('sync_pairs').doc(pairDoc._id).update({ data: { eventBound: true, eventBoundAt: now } });
    } catch (e) {}
    return { ok: true, id: saved._id, status: 'pending_manual_review' };
  } catch (e) {
    return { ok: false, code: 'DRAFT_SAVE_FAILED', message: String(e) };
  }
};
