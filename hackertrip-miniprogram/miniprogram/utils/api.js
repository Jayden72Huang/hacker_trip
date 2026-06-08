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

const STORAGE = {
  CARDS: 'ht_cards', // 我保存的卡片
  BOOKMARKS: 'ht_bookmarks', // 收藏的黑客松 id
  REGISTRATIONS: 'ht_registrations', // 报名清单
  SCAN_RESULTS: 'ht_scan_results', // Skills 同步过来的扫描匹配结果
};

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
  if (cloudReady()) {
    try {
      const res = await callFn('getHackathons', params);
      if (res && Array.isArray(res.list)) return res.list;
    } catch (e) {
      console.warn('[api] getHackathons 云端失败，降级本地', e);
    }
  }
  return filterLocal(LOCAL_HACKATHONS, params);
}

async function getHackathonDetail(id) {
  if (cloudReady()) {
    try {
      const res = await callFn('getHackathonDetail', { id });
      if (res && res.hackathon) return res.hackathon;
    } catch (e) {
      console.warn('[api] getHackathonDetail 云端失败，降级本地', e);
    }
  }
  return LOCAL_HACKATHONS.find((h) => h.id === id) || null;
}

/* ----------------------------- 收藏 / 报名 ----------------------------- */

function getBookmarks() {
  return getStorage(STORAGE.BOOKMARKS, []);
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
  return getStorage(STORAGE.REGISTRATIONS, []);
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
  return getStorage(STORAGE.CARDS, []);
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

/* ----------------------- Skills 同步（扫描结果） ----------------------- */

function getScanResults() {
  return getStorage(STORAGE.SCAN_RESULTS, null);
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
      return res || { ok: false, message: '配对码无效或已过期' };
    } catch (e) {
      console.warn('[api] pairSync 云端失败', e);
      return { ok: false, message: '网络异常，请重试' };
    }
  }
  // 本地 mock：演示同步成功落地
  const mock = require('../data/mock-scan.js');
  setScanResults(mock);
  return { ok: true, scan: mock, mock: true };
}

module.exports = {
  STORAGE,
  cloudReady,
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
  getScanResults,
  setScanResults,
  pullSyncByCode,
};
