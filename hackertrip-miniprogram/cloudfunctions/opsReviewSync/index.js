// 云函数：运营审核同步（服务端 ↔ 飞书）。HTTP 触发器，密钥鉴权，无需微信开发者工具。
//   action='export' —— 返回全部组织者申请 + 赛事草稿，供飞书正向同步读取
//   action='apply'  —— 接收飞书审核决定，逐条调 adminHackathonManage 写回云库并通知申请人
//
// 鉴权：请求头 x-ops-token / Authorization: Bearer <token> / body.opsToken，须等于环境变量 OPS_SYNC_TOKEN。
// 写回：cloud.callFunction 调 adminHackathonManage，带 __internalSecret(=OPS_INTERNAL_SECRET) 跳过 openid 校验。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const OPS_TOKEN = process.env.OPS_SYNC_TOKEN || '';
const INTERNAL_SECRET = process.env.OPS_INTERNAL_SECRET || '';

function normalizeEvent(event) {
  const input = event || {};
  if (input.body) {
    if (typeof input.body === 'string') {
      try { return Object.assign({}, input, JSON.parse(input.body)); } catch (e) { return input; }
    }
    if (typeof input.body === 'object') return Object.assign({}, input, input.body);
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

function readOpsToken(rawEvent, event) {
  const bodyToken = event && event.opsToken ? String(event.opsToken) : '';
  const headers = (rawEvent && rawEvent.headers) || (event && event.headers) || {};
  const direct = getHeader(headers, 'x-ops-token');
  const auth = getHeader(headers, 'authorization');
  if (direct) return String(direct);
  if (auth && /^Bearer\s+/i.test(String(auth))) return String(auth).replace(/^Bearer\s+/i, '').trim();
  return bodyToken;
}

// 云库单次 get 上限 100（wx-server-sdk 服务端），按 count 分页取全量
async function readAll(collection) {
  const countRes = await db.collection(collection).count();
  const total = countRes.total || 0;
  if (total === 0) return [];
  const pages = [];
  for (let i = 0; i < total; i += 100) {
    pages.push(db.collection(collection).skip(i).limit(100).get());
  }
  const results = await Promise.all(pages);
  return results.reduce((acc, r) => acc.concat(r.data || []), []);
}

exports.main = async (rawEvent) => {
  const event = normalizeEvent(rawEvent);
  const token = readOpsToken(rawEvent, event);
  if (!OPS_TOKEN || token !== OPS_TOKEN) {
    return { ok: false, code: 'UNAUTHORIZED', message: '同步密钥无效' };
  }

  const action = String((event || {}).action || '');

  if (action === 'export') {
    try {
      const [organizers, drafts] = await Promise.all([
        readAll('organizer_applications'),
        readAll('hackathon_drafts'),
      ]);
      return { ok: true, organizers, drafts, exportedAt: Date.now() };
    } catch (e) {
      return { ok: false, code: 'EXPORT_FAILED', message: String(e) };
    }
  }

  if (action === 'apply') {
    if (!INTERNAL_SECRET) return { ok: false, code: 'NO_INTERNAL_SECRET', message: '未配置内部密钥' };
    const items = Array.isArray(event.items) ? event.items : [];
    const results = [];
    for (const it of items) {
      const kind = it && it.kind;                    // 'organizer' | 'draft'
      const id = String((it && it.id) || '');
      const decision = it && it.decision;            // 'approve' | 'reject'
      const reason = String((it && it.reason) || '');
      if (!id || !kind || !decision) { results.push({ id, ok: false, message: '参数不完整' }); continue; }

      const data = { __internalSecret: INTERNAL_SECRET, reason };
      if (kind === 'organizer') {
        data.action = decision === 'approve' ? 'approveOrganizer' : 'rejectOrganizer';
        data.applicationId = id;
      } else if (kind === 'draft') {
        data.action = decision === 'approve' ? 'approveDraft' : 'rejectDraft';
        data.draftId = id;
      } else {
        results.push({ id, ok: false, message: '未知申请类型' });
        continue;
      }

      try {
        const res = await cloud.callFunction({ name: 'adminHackathonManage', data });
        const ok = !!(res && res.result && res.result.ok);
        results.push({ id, kind, decision, ok, result: res && res.result });
      } catch (e) {
        results.push({ id, kind, decision, ok: false, message: String(e) });
      }
    }
    return { ok: true, results, appliedAt: Date.now() };
  }

  return { ok: false, code: 'UNKNOWN_ACTION', message: '未知动作，仅支持 export / apply' };
};
