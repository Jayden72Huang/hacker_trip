// 云函数：Skills 同步配对
//   action='create' —— 小程序端为当前 openid 生成一次性配对码和上传 token
//   action='push'   —— CLI / 网页端通过 HTTP 触发器写入扫描结果
//   action='pull'   —— 小程序端凭配对码拉取，并绑定到当前 openid
//
//
// 集合 sync_pairs: { code, uploadToken, scan, card, works, openid, bound, createdAt, expireAt }
// 集合 works:      选手作品落库（pull 时 best-effort 写入），{ openid, name, summary, repo, demo, cover, techStack, awards, source, createdAt, updatedAt }
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const TTL_MS = 30 * 60 * 1000; // 配对码 30 分钟有效
const CODE_RE = /^\d{6}$/;
const SYNC_TOKEN = process.env.SYNC_TOKEN || '';

function makePairCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function makeUploadToken() {
  return crypto.randomBytes(24).toString('hex');
}

function cleanText(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 500);
}

// 技术栈：数组或逗号串，每项 ≤40，最多 12 个
function cleanTechStack(value) {
  let list = [];
  if (Array.isArray(value)) {
    list = value;
  } else if (typeof value === 'string') {
    list = value.split(/[,\n，、]/);
  }
  return list
    .map((x) => cleanText(x, 40))
    .filter(Boolean)
    .slice(0, 12);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

// 选手作品 works[]：每项清洗限长 + 格式校验（链接须 http(s)），过滤非法项，整体限 20 条
// 合格作品的硬标准：必须有 name 且至少一个有效链接(repo 或 demo)
function cleanWorks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const src = item && typeof item === 'object' ? item : {};
      const repo = cleanText(src.repo, 300);
      const demo = cleanText(src.demo, 300);
      const cover = cleanText(src.cover, 300);
      return {
        name: cleanText(src.name, 80),
        summary: cleanText(src.summary, 500),
        // 链接必须是 http(s)，非法链接置空（避免脏数据/钓鱼链接）
        repo: isHttpUrl(repo) ? repo : '',
        demo: isHttpUrl(demo) ? demo : '',
        cover: isHttpUrl(cover) ? cover : '',
        techStack: cleanTechStack(src.techStack),
        awards: cleanText(src.awards, 120),
      };
    })
    .filter((w) => w.name && (w.repo || w.demo))
    .slice(0, 20);
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

function readSyncToken(rawEvent, event) {
  const bodyToken = event && event.syncToken ? String(event.syncToken) : '';
  const headers = (rawEvent && rawEvent.headers) || (event && event.headers) || {};
  const direct = getHeader(headers, 'x-sync-token');
  const auth = getHeader(headers, 'authorization');
  if (direct) return String(direct);
  if (auth && /^Bearer\s+/i.test(String(auth))) return String(auth).replace(/^Bearer\s+/i, '').trim();
  return bodyToken;
}

exports.main = async (rawEvent, context) => {
  const event = normalizeEvent(rawEvent);
  const { action, code } = event || {};
  const col = db.collection('sync_pairs');
  const now = Date.now();
  const openid = (cloud.getWXContext() || {}).OPENID;

  // ---- 小程序端创建一次性配对会话 ----
  if (action === 'create') {
    if (!openid) return { ok: false, message: '缺少用户身份' };
    try {
      let pairCode = makePairCode();
      let existed = await col.where({ code: pairCode }).limit(1).get();
      let tries = 0;
      while (existed.data && existed.data[0] && tries < 5) {
        pairCode = makePairCode();
        existed = await col.where({ code: pairCode }).limit(1).get();
        tries += 1;
      }
      if (existed.data && existed.data[0]) return { ok: false, message: '配对码生成失败，请重试' };
      const uploadToken = makeUploadToken();
      await col.add({
        data: {
          code: pairCode,
          uploadToken,
          openid,
          bound: false,
          scan: null,
          card: null,
          createdAt: now,
          expireAt: now + TTL_MS,
        },
      });
      return { ok: true, code: pairCode, uploadToken, expireAt: now + TTL_MS };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }

  // ---- CLI/网页端推送扫描结果 ----
  if (action === 'push') {
    const { scan, card, pairCode } = event;
    const c = (pairCode || code || '').toUpperCase();
    if (!c || !scan) return { ok: false, message: '缺少配对码或扫描数据' };
    if (!CODE_RE.test(c)) return { ok: false, message: '配对码格式错误' };
    try {
      const exist = await col.where({ code: c }).limit(1).get();
      const doc = exist.data && exist.data[0];
      const uploadToken = readSyncToken(rawEvent, event);
      const hasGlobalToken = !!(SYNC_TOKEN && uploadToken === SYNC_TOKEN);
      const hasPairToken = !!(doc && doc.uploadToken && uploadToken === doc.uploadToken);
      if (!hasGlobalToken && !hasPairToken) return { ok: false, message: '同步密钥无效' };
      if (doc && doc.expireAt && doc.expireAt < now) return { ok: false, message: '配对码已过期，请重新生成' };
      if (doc && doc.bound) return { ok: false, message: '配对码已被使用，请重新生成' };

      // 作品格式硬校验：传了 works 但全部不合格（缺名称或无有效链接）则直接拒绝，不写库
      const cleanedWorks = cleanWorks(event.works);
      if (Array.isArray(event.works) && event.works.length && !cleanedWorks.length) {
        return { ok: false, code: 'INVALID_WORK', message: '作品需含名称和有效的 repo/demo 链接(http/https)' };
      }

      const payload = {
        code: c,
        scan,
        card: card || null,
        works: cleanedWorks,
        bound: false,
        pushedAt: now,
        expireAt: doc && doc.expireAt ? doc.expireAt : now + TTL_MS,
      };
      if (doc) {
        // 用 set 整体覆盖：update 对嵌套对象做深度 merge，当原 scan/card 为 null 时
        // 无法创建子路径(Cannot create field in element {scan:null})，故合并原字段后整体写回。
        const merged = Object.assign({}, doc, payload);
        delete merged._id;
        await col.doc(doc._id).set({ data: merged });
      } else {
        await col.add({ data: Object.assign({}, payload, { createdAt: now }) });
      }
      return { ok: true, code: c };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }

  // ---- 小程序端拉取 ----
  if (action === 'pull') {
    const c = (code || '').toUpperCase();
    if (!c) return { ok: false, message: '请输入配对码' };
    if (!CODE_RE.test(c)) return { ok: false, message: '配对码格式错误' };
    if (!openid) return { ok: false, message: '缺少用户身份' };
    try {
      const res = await col.where({ code: c }).limit(1).get();
      const doc = res.data && res.data[0];
      if (!doc) return { ok: false, message: '配对码无效' };
      if (doc.expireAt && doc.expireAt < now) return { ok: false, message: '配对码已过期，请在电脑端重新生成' };
      if (doc.openid && doc.openid !== openid) return { ok: false, message: '配对码不属于当前账号' };
      if (doc.bound) return { ok: false, message: '配对码已使用，请在电脑端重新生成' };
      if (!doc.scan) return { ok: false, message: '桌面端还没有推送结果，请稍后再试' };

      // 绑定到当前用户
      await col.doc(doc._id).update({ data: { bound: true, openid, boundAt: now } });

      // 同步把卡片落库到用户名下（best-effort）
      if (doc.card && openid) {
        try {
          await db.collection('cards').add({ data: Object.assign({}, doc.card, { openid, updatedAt: now }) });
        } catch (e) {}
      }

      // 同步把选手作品落库到用户名下（best-effort，逐条写入 works 集合）
      const works = Array.isArray(doc.works) ? doc.works : [];
      if (works.length && openid) {
        for (let i = 0; i < works.length; i++) {
          try {
            await db.collection('works').add({
              data: Object.assign({}, works[i], {
                openid,
                source: 'cli',
                status: 'pending', // 进待审核，用户在小程序「我的→作品」确认发布后才公开
                createdAt: now,
                updatedAt: now,
              }),
            });
          } catch (e) {}
        }
      }
      return { ok: true, scan: doc.scan, card: doc.card, works };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }

  return { ok: false, message: '未知 action' };
};
