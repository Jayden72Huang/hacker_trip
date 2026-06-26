/**
 * 卡面解锁体系（F2 集卡）—— 纯函数，零副作用。
 * 角色卡（roles.js 的 10 个）之外，新增「成就限定卡」。
 * 解锁条件大多由现有资产（报名数 / 技术栈 / Skills 同步 / 暗号邀请）派生，
 * 云端只持久化「服务端授予」的卡（invited_limited / recruiter），其余前端可离线判定。
 */

const RARITY_META = {
  N: { label: '普通', color: '#7A7A75' },
  R: { label: '稀有', color: '#0C51ED' },
  SR: { label: '史诗', color: '#7C3AED' },
  SSR: { label: '传说', color: '#FBD902' },
};

// 成就限定卡（key 与云端 users.unlockedCards 对齐）
const SPECIAL_CARDS = [
  { key: 'invited_limited', name: '被邀请限定', emoji: '🎟️', rarity: 'SR', desc: '通过好友暗号加入', cond: '用好友暗号让 Haki 识别你', source: 'server' },
  { key: 'recruiter', name: '招募官', emoji: '📣', rarity: 'SR', desc: '招募值达到 3', cond: '邀请 3 位朋友用你的暗号', source: 'server' },
  { key: 'first_blood', name: '首战纪念', emoji: '🩸', rarity: 'R', desc: '报名第一场赛事', cond: '报名任意 1 场黑客松', source: 'derive' },
  { key: 'streak_3', name: '三连击', emoji: '🔥', rarity: 'SR', desc: '报名满 3 场赛事', cond: '累计报名 3 场黑客松', source: 'derive' },
  { key: 'hexagon_master', name: '六边形大师', emoji: '🛡️', rarity: 'SSR', desc: '技术栈横跨 4 个领域', cond: '技术栈覆盖 4 个不同领域', source: 'derive' },
  { key: 'synced', name: 'Skills 接入', emoji: '🔗', rarity: 'R', desc: '完成一次 Skills 同步', cond: '从电脑同步一次项目画像', source: 'derive' },
];

/**
 * 派生当前用户已解锁的成就卡 key 集合。
 * @param {object} ctx { stats:{hackathons}, techCategoryCount, serverUnlocked:[], hasSync }
 * @returns {Set<string>}
 */
function deriveUnlocked(ctx) {
  const c = ctx || {};
  const stats = c.stats || {};
  const set = new Set(Array.isArray(c.serverUnlocked) ? c.serverUnlocked : []);
  if ((stats.hackathons || 0) >= 1) set.add('first_blood');
  if ((stats.hackathons || 0) >= 3) set.add('streak_3');
  if ((c.techCategoryCount || 0) >= 4) set.add('hexagon_master');
  if (c.hasSync) set.add('synced');
  return set;
}

/** 组装卡册视图模型：每张卡带 unlocked 标记 + 稀有度元数据，供 wxml 直接渲染 */
function buildCardbook(ctx) {
  const unlocked = deriveUnlocked(ctx);
  const cards = SPECIAL_CARDS.map((card) => {
    const r = RARITY_META[card.rarity] || RARITY_META.N;
    return Object.assign({}, card, {
      unlocked: unlocked.has(card.key),
      rarityLabel: r.label,
      rarityColor: r.color,
    });
  });
  return {
    cards,
    unlockedCount: cards.filter((c) => c.unlocked).length,
    total: cards.length,
  };
}

module.exports = { RARITY_META, SPECIAL_CARDS, deriveUnlocked, buildCardbook };
