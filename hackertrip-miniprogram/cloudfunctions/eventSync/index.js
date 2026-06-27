// 云函数：主办方活动提交（外部 CLI / HTTP 触发器入口）。
//   action='submit' —— 主办方通过 CLI / 网页端提交活动信息，写入 hackathon_drafts 草稿箱。
//
// 安全边界：
//   1) 若配置环境变量 EVENT_SUBMIT_TOKEN，则校验 header x-sync-token 或 body.submitToken；未配置则放行（靠人工审核兜底）。
//   2) 所有文本 cleanText 限长，防止超长内容。
//   3) 有 openid 时调用微信内容安全 msgSecCheck（scene 3, version 2），risky 拒绝；
//      纯 HTTP（无 openid）跳过安全检查，但标记 needsSecurityReview:true，交人工复核。
//
// 草稿字段对齐 adminHackathonManage 的 publicDraftFields，审核通过后可直接转入 hackathons。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const REQUIRED_FIELDS = ['name', 'city', 'startDate', 'endDate', 'website'];
const RECOMMENDED_FIELDS = ['summary', 'prizePool', 'registrationDeadline', 'organizerContact', 'tracks'];
const EVENT_SUBMIT_TOKEN = process.env.EVENT_SUBMIT_TOKEN || '';

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
  const bodyToken = event && event.submitToken ? String(event.submitToken) : '';
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

function buildSecurityText(form) {
  return [form.name, form.shortName, form.summary, form.theme, form.tracks.join(' '), form.organizerName]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2500);
}

exports.main = async (rawEvent, context) => {
  const event = normalizeEvent(rawEvent);
  const action = cleanText((event || {}).action || 'submit', 40);
  const openid = (cloud.getWXContext() || {}).OPENID || '';

  if (action !== 'submit') {
    return { ok: false, code: 'UNKNOWN_ACTION', message: '未知 action' };
  }

  // ---- 防滥用 ①：提交 token 校验（仅在配置了环境变量时生效）----
  if (EVENT_SUBMIT_TOKEN) {
    const token = readSubmitToken(rawEvent, event);
    if (!token || token !== EVENT_SUBMIT_TOKEN) {
      return { ok: false, code: 'BAD_TOKEN', message: '提交凭证无效' };
    }
  }

  const form = normalizeForm(readForm(event));

  // ---- 必填校验 ----
  const missing = findMissing(form);
  if (missing.length) {
    return {
      ok: false,
      code: 'INVALID_FORM',
      message: '请补全名称、城市、起止日期和官网',
      missing,
    };
  }

  // ---- 防滥用 ③：内容安全检测（有 openid 才走 msgSecCheck）----
  let needsSecurityReview = false;
  let securityResult = null;
  let securityTraceId = '';
  if (openid) {
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
  } else {
    // 纯 HTTP 提交无法过内容安全，交人工复核
    needsSecurityReview = true;
  }

  // ---- 写入草稿箱 ----
  const now = Date.now();
  const recommendedMissing = findRecommendedMissing(form);
  const draft = Object.assign({}, form, {
    openid: openid || '',
    status: 'pending_manual_review',
    source: 'organizer_cli',
    organizerName: form.organizerName,
    organizerContact: form.organizerContact,
    needsSecurityReview,
    securityResult,
    securityTraceId,
    admissionCheck: {
      passed: false,
      missing: recommendedMissing,
      note: '外部提交待人工核实',
    },
    submittedAt: now,
    updatedAt: now,
  });

  try {
    const saved = await db.collection('hackathon_drafts').add({ data: draft });
    return { ok: true, id: saved._id, status: 'pending_manual_review' };
  } catch (e) {
    return { ok: false, code: 'DRAFT_SAVE_FAILED', message: String(e) };
  }
};
