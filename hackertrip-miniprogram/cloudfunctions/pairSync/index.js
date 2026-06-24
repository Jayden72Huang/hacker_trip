// 云函数：Skills 同步配对
//   action='push' —— CLI / 网页端 通过 HTTP 触发器写入扫描结果（带 6 位配对码）
//   action='pull' —— 小程序端 凭配对码拉取，并绑定到当前 openid
//
// 集合 sync_pairs: { code, scan, card, openid, bound, createdAt, expireAt }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const TTL_MS = 30 * 60 * 1000; // 配对码 30 分钟有效
const CODE_RE = /^\d{6}$/;

exports.main = async (event, context) => {
  const { action, code } = event || {};
  const col = db.collection('sync_pairs');
  const now = Date.now();

  // ---- CLI/网页端推送扫描结果 ----
  if (action === 'push') {
    const { scan, card, pairCode } = event;
    const c = (pairCode || code || '').toUpperCase();
    if (!c || !scan) return { ok: false, message: '缺少配对码或扫描数据' };
    if (!CODE_RE.test(c)) return { ok: false, message: '配对码格式错误' };
    try {
      // 覆盖式写入（同码重推则更新）
      const exist = await col.where({ code: c }).limit(1).get();
      const payload = { code: c, scan, card: card || null, bound: false, createdAt: now, expireAt: now + TTL_MS };
      if (exist.data && exist.data[0]) {
        await col.doc(exist.data[0]._id).update({ data: payload });
      } else {
        await col.add({ data: payload });
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
    const openid = (cloud.getWXContext() || {}).OPENID;
    if (!openid) return { ok: false, message: '缺少用户身份' };
    try {
      const res = await col.where({ code: c }).limit(1).get();
      const doc = res.data && res.data[0];
      if (!doc) return { ok: false, message: '配对码无效' };
      if (doc.expireAt && doc.expireAt < now) return { ok: false, message: '配对码已过期，请在电脑端重新生成' };

      // 绑定到当前用户
      await col.doc(doc._id).update({ data: { bound: true, openid, boundAt: now } });

      // 同步把卡片落库到用户名下（best-effort）
      if (doc.card && openid) {
        try {
          await db.collection('cards').add({ data: Object.assign({}, doc.card, { openid, updatedAt: now }) });
        } catch (e) {}
      }
      return { ok: true, scan: doc.scan, card: doc.card };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }

  return { ok: false, message: '未知 action' };
};
