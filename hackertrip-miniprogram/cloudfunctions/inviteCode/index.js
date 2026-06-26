// 云函数：inviteCode —— 为当前用户取/建专属邀请暗号（F1 Haki 暗号）。
// 集合 invites: { code, ownerOpenid, ownerPublicId, createdAt, redeemCount, redeemedBy[] }
// 设计：一个 openid 一个稳定暗号；格式 HT-XXXX（去掉易混字符的 base32），冲突重试。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 去掉 0/O/1/I/L 等易混字符，避免口头/手输误差
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function randCode() {
  let s = '';
  for (let i = 0; i < 4; i += 1) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `HT-${s}`;
}

async function ensureUniqueCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randCode();
    // eslint-disable-next-line no-await-in-loop
    const existed = await db.collection('invites').where({ code }).limit(1).get();
    if (!existed.data || !existed.data.length) return code;
  }
  // 极端冲突兜底：加时间戳尾巴
  return `HT-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

exports.main = async () => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };

  try {
    const col = db.collection('invites');
    // 用户已有暗号 → 直接返回
    const mine = await col.where({ ownerOpenid: openid }).limit(1).get();
    let invite = mine.data && mine.data[0];

    if (!invite) {
      // 读公开 id（可能尚未生成，允许为空，redeem 时再补）
      let ownerPublicId = '';
      try {
        const u = await db.collection('users').where({ openid }).limit(1).get();
        if (u.data && u.data[0]) ownerPublicId = u.data[0].publicId || '';
      } catch (e) { ownerPublicId = ''; }

      const code = await ensureUniqueCode();
      const doc = {
        code,
        ownerOpenid: openid,
        ownerPublicId,
        createdAt: Date.now(),
        redeemCount: 0,
        redeemedBy: [],
      };
      await col.add({ data: doc });
      invite = doc;
    }

    // 招募值从 users 读（redeemInvite 维护）
    let recruitScore = 0;
    try {
      const u = await db.collection('users').where({ openid }).limit(1).get();
      if (u.data && u.data[0]) recruitScore = u.data[0].recruitScore || 0;
    } catch (e) { recruitScore = 0; }

    return {
      ok: true,
      code: invite.code,
      redeemCount: invite.redeemCount || 0,
      recruitScore,
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
