/**
 * 数据访问层 —— 全站唯一数据入口。
 *
 * 设计原则（与官网 identity 系统同源）：
 *   云开发可用   → 调云函数 wx.cloud.callFunction
 *   云开发不可用 → 自动降级到本地 bundled 数据 + storage，永不抛错阻断 UI
 *
 * 因此在开发者工具里、未配置 envId 时，全部页面与卡片玩法都能跑通。
 */

const LOCAL_HACKATHONS = require('../data/hackathons.js');
const catalog = require('./catalog.js');

const STORAGE = {
  CARDS: 'ht_cards', // 我保存的卡片
  BOOKMARKS: 'ht_bookmarks', // 收藏的黑客松 id
  REGISTRATIONS: 'ht_registrations', // 报名清单
  SCAN_RESULTS: 'ht_scan_results', // Skills 同步过来的扫描匹配结果
  PROFILE: 'ht_profile', // 统一用户档案（身份编辑/身份卡/公开主页/分享/设置共享）
};

/** 全站统一的用户档案默认值（替代各页面散落的硬编码 mock） */
const DEFAULT_PROFILE = {
  nickname: 'Jayden',
  role: 'AI Builder',
  city: '上海',
  bio: '关注 AI 产品原型、Agent 工作流和黑客松快速交付。',
  skills: ['TypeScript', 'LLM', 'React', 'Prompt'],
  github: 'github.com/jayden',
  avatarUrl: '',
};

/** 作品集示例数据（暂为 bundled，将来接真实存储后由此处统一替换） */
const SAMPLE_PORTFOLIO = [
  {
    name: 'Haki Match Agent',
    subtitle: '根据项目技术栈匹配黑客松和推荐赛道',
    event: 'AdventureX 2025',
    status: '已提交',
    tags: ['LLM', 'TypeScript', '匹配算法'],
  },
  {
    name: 'Pitch Deck Copilot',
    subtitle: '把 Demo、README 和路演稿整理为评委可读材料',
    event: 'ETHShanghai',
    status: '准备中',
    tags: ['AI Agent', 'Slides', 'Web3'],
  },
  {
    name: 'Realtime Judge Board',
    subtitle: '黑客松现场评分看板和队伍进度追踪',
    event: 'XR 黑客松',
    status: '获奖作品',
    tags: ['Dashboard', 'Realtime', 'Cloud'],
  },
];
/** 读取作品集列表（个人中心作品数、作品集页面共用同一份数据源） */
function getPortfolioProjects() {
  return SAMPLE_PORTFOLIO.slice();
}

function cloudReady() {
  const app = getApp();
  return !!(app && app.globalData && app.globalData.cloudReady && wx.cloud);
}

/** 统一云函数调用，失败抛错给上层 catch 走降级 */
function callFn(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: data || {},
      success: (res) => resolve(res.result),
      fail: (err) => reject(err),
    });
  });
}

function getStorage(key, def) {
  try {
    const v = wx.getStorageSync(key);
    return v === '' || v === undefined || v === null ? def : v;
  } catch (e) {
    return def;
  }
}
function setStorage(key, val) {
  try { wx.setStorageSync(key, val); } catch (e) {}
}

/* ----------------------------- 黑客松 ----------------------------- */

/** 本地筛选/排序，模拟云函数行为 */
function filterLocal(list, params) {
  params = params || {};
  let r = list.slice();
  const q = (params.q || '').trim().toLowerCase();
  if (q) {
    r = r.filter((h) =>
      [h.name, h.shortName, h.city, h.theme, (h.tags || []).join(' '), (h.tracks || []).join(' ')]
        .join(' ').toLowerCase().includes(q),
    );
  }
  if (params.mode && params.mode !== 'all') r = r.filter((h) => h.mode === params.mode);
  if (params.status === 'upcoming') r = r.filter((h) => !h.isPast);
  if (params.status === 'ended') r = r.filter((h) => h.isPast);
  if (params.sort === 'name') {
    r.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    r.sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
  }
  return r;
}

async function getHackathons(params) {
  const options = params || {};
  const today = catalog.formatDate(new Date());
  let raw = null;

  if (cloudReady()) {
    try {
      const res = await callFn('getHackathons', options);
      if (res && Array.isArray(res.list)) raw = res.list;
    } catch (e) {
      console.warn('[api] getHackathons 云端失败，降级本地', e);
    }
  }
  if (!raw) raw = filterLocal(LOCAL_HACKATHONS, options);

  // 统一 status 派生（云端/本地数据都经过 decorate，shape 与 catalog 一致）
  const list = raw.map((item) => catalog.decorate(item, today));
  if (options.includeEnded) return list;
  return list.filter((item) => item.status !== 'ended');
}

async function getHackathonDetail(id) {
  const today = catalog.formatDate(new Date());
  let raw = null;

  if (cloudReady()) {
    try {
      const res = await callFn('getHackathonDetail', { id });
      if (res && res.hackathon) raw = res.hackathon;
    } catch (e) {
      console.warn('[api] getHackathonDetail 云端失败，降级本地', e);
    }
  }
  if (!raw) raw = LOCAL_HACKATHONS.find((h) => h.id === id) || null;

  return raw ? catalog.decorate(raw, today) : null;
}

/* ----------------------------- 收藏 / 报名 ----------------------------- */

function getBookmarks() {
  const v = getStorage(STORAGE.BOOKMARKS, []);
  return Array.isArray(v) ? v : [];
}
function isBookmarked(id) {
  return getBookmarks().indexOf(id) !== -1;
}
function toggleBookmark(id) {
  const list = getBookmarks();
  const i = list.indexOf(id);
  if (i === -1) list.push(id); else list.splice(i, 1);
  setStorage(STORAGE.BOOKMARKS, list);
  if (cloudReady()) callFn('toggleBookmark', { id, active: i === -1 }).catch(() => {});
  return i === -1; // true=已收藏
}
async function getBookmarkedHackathons() {
  const ids = getBookmarks();
  const all = await getHackathons({});
  return all.filter((h) => ids.indexOf(h.id) !== -1);
}

function getRegistrations() {
  const v = getStorage(STORAGE.REGISTRATIONS, []);
  return Array.isArray(v) ? v : [];
}
function addRegistration(item) {
  const list = getRegistrations();
  if (!list.find((x) => x.id === item.id)) {
    list.unshift(Object.assign({ registeredAt: Date.now() }, item));
    setStorage(STORAGE.REGISTRATIONS, list);
    if (cloudReady()) callFn('addRegistration', { item }).catch(() => {});
  }
  return list;
}

/* ----------------------------- 卡片 ----------------------------- */

function getCards() {
  const v = getStorage(STORAGE.CARDS, []);
  return Array.isArray(v) ? v : [];
}
function saveCard(card) {
  const list = getCards();
  const idx = list.findIndex((c) => c.id === card.id);
  const stamped = Object.assign({ updatedAt: Date.now() }, card);
  if (idx === -1) list.unshift(stamped); else list[idx] = stamped;
  setStorage(STORAGE.CARDS, list);
  if (cloudReady()) callFn('saveCard', { card: stamped }).catch(() => {});
  return stamped;
}
function getCardById(id) {
  return getCards().find((c) => c.id === id) || null;
}

/* ----------------------------- 用户档案 ----------------------------- */

/** 读取统一用户档案，缺字段用默认值补齐，永不返回 null */
function getProfile() {
  const v = getStorage(STORAGE.PROFILE, null);
  return Object.assign({}, DEFAULT_PROFILE, v && typeof v === 'object' ? v : {});
}
/** 合并保存用户档案（patch 部分更新），同步 best-effort 上云 */
function saveProfile(patch) {
  const next = Object.assign({}, getProfile(), patch || {});
  setStorage(STORAGE.PROFILE, next);
  if (cloudReady()) callFn('saveProfile', { profile: next }).catch(() => {});
  return next;
}
/** 由真实收藏/报名/卡片数量派生用户资产统计，供个人中心/公开主页/分享复用 */
function getUserStats() {
  const profile = getProfile();
  return {
    hackathons: getRegistrations().length,
    bookmarks: getBookmarks().length,
    projects: getCards().length,
    skills: Array.isArray(profile.skills) ? profile.skills.length : 0,
  };
}

/* ----------------------------- AI 聊天 ----------------------------- */

/**
 * Haki AI 问答：调 aiChat 云函数（混元），失败/未配置云开发时降级兜底文案。
 * @param {string} message 用户当前问题
 * @param {Array<{role,text}>} history 对话历史（仅 user/assistant）
 * @returns {Promise<{ok:boolean, reply:string, fallback?:boolean}>}
 */
async function aiChat(message, history, focusEventId) {
  const text = String(message || '').trim();
  if (!text) return { ok: false, reply: '说点什么吧，比如"我会 React，适合参加哪个？"', fallback: true };

  if (cloudReady()) {
    try {
      const payload = {
        message: text,
        focusEventId: focusEventId || '',
        history: (Array.isArray(history) ? history : [])
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.text)
          .map((m) => ({ role: m.role, content: m.text })),
      };
      const res = await callFn('aiChat', payload);
      if (res && res.reply) return res;
    } catch (e) {
      console.warn('[api] aiChat 云端调用失败，降级兜底', e);
    }
  }

  return {
    ok: false,
    fallback: true,
    reply:
      '当前没有连接到 AI 服务。把你的技术栈、城市偏好和组队意向告诉我，正式上线后我会按赛事的时间、地点、赛道和奖金给出匹配建议。',
  };
}

/* ----------------------- Skills 同步（扫描结果） ----------------------- */

function getScanResults() {
  const v = getStorage(STORAGE.SCAN_RESULTS, null);
  if (!v || typeof v !== 'object') return null;
  // 归一化：保证 project / matches / identity 结构完整，避免页面空引用崩溃
  return {
    syncedAt: v.syncedAt || 0,
    source: v.source || '',
    project: v.project && typeof v.project === 'object' ? v.project : {},
    identity: v.identity && typeof v.identity === 'object' ? v.identity : null,
    matches: Array.isArray(v.matches) ? v.matches : [],
  };
}
function setScanResults(data) {
  setStorage(STORAGE.SCAN_RESULTS, data);
}

/**
 * 提交配对码，从云端拉取 CLI/网页端推送的 Skills 同步内容。
 * 云端不可用时返回一份 mock 扫描结果，便于演示同步落地效果。
 */
async function pullSyncByCode(code) {
  if (cloudReady()) {
    try {
      const res = await callFn('pairSync', { code, action: 'pull' });
      if (res && res.ok) {
        if (res.scan) setScanResults(res.scan);
        if (res.card) saveCard(res.card);
        return res;
      }
      // 云端明确判定配对码无效/过期：如实返回，不降级
      return res || { ok: false, message: '配对码无效或已过期' };
    } catch (e) {
      // 云函数未部署 / 网络异常：与全站一致降级本地 mock，不阻断同步演示
      console.warn('[api] pairSync 云端调用失败，降级本地 mock', e);
    }
  }
  // 本地 mock：演示同步成功落地
  const mock = require('../data/mock-scan.js');
  setScanResults(mock);
  return { ok: true, scan: mock, mock: true };
}

/* ----------------------------- 登录态 / 云同步 ----------------------------- */

/** 是否已登录（globalData.auth 有 userInfo） */
function isLoggedIn() {
  const app = getApp();
  return !!(app && app.globalData && app.globalData.auth && app.globalData.auth.userInfo);
}

/**
 * 写操作前的登录守卫：未登录则跳登录页(带 redirect 回原页)，返回 false 表示已拦截。
 * @param {string} redirectPage 当前页完整路径(含参数)，登录后回跳
 */
function requireAuth(redirectPage) {
  if (isLoggedIn()) return true;
  const url = redirectPage
    ? '/pages/login/login?redirect=' + encodeURIComponent(redirectPage)
    : '/pages/login/login';
  wx.navigateTo({ url });
  return false;
}

/** 登录后从云端拉取收藏/报名/卡片/同步结果，合并进本地 storage(云端为准) */
async function syncFromCloud() {
  if (!cloudReady()) return { ok: false };
  try {
    const res = await callFn('getProfile', {});
    if (res && res.ok) {
      if (Array.isArray(res.bookmarkIds)) setStorage(STORAGE.BOOKMARKS, res.bookmarkIds);
      if (Array.isArray(res.registrations)) setStorage(STORAGE.REGISTRATIONS, res.registrations);
      if (Array.isArray(res.cards)) setStorage(STORAGE.CARDS, res.cards);
      if (res.scan) setScanResults(res.scan);
      return { ok: true };
    }
  } catch (e) {
    console.warn('[api] syncFromCloud 失败', e);
  }
  return { ok: false };
}

module.exports = {
  STORAGE,
  cloudReady,
  isLoggedIn,
  requireAuth,
  syncFromCloud,
  getHackathons,
  getHackathonDetail,
  getBookmarks,
  isBookmarked,
  toggleBookmark,
  getBookmarkedHackathons,
  getRegistrations,
  addRegistration,
  getCards,
  saveCard,
  getCardById,
  getProfile,
  saveProfile,
  getUserStats,
  getPortfolioProjects,
  getScanResults,
  setScanResults,
  pullSyncByCode,
  aiChat,
};
