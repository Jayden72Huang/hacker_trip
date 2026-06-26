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
  AGENT_CONFIG: 'ht_agent_config', // Haki 可读取上下文配置
  PROFILE: 'ht_profile', // 统一用户档案（身份编辑/身份卡/公开主页/分享/设置共享）
  PROFILE_MODE: 'ht_profile_mode', // 我的页角色视图偏好
  ORGANIZER: 'ht_organizer_application', // 组织者申请与审核状态
  HACKATHON_DRAFTS: 'ht_hackathon_drafts', // 组织者提交的赛事草稿
  GROWTH: 'ht_growth', // 裂变成长态：暗号 / 招募值 / 被邀请 / 已解锁卡面
};

/** 裂变成长态默认值（F1 暗号 + F2 集卡共用） */
const DEFAULT_GROWTH = {
  inviteCode: '',
  recruitScore: 0,
  redeemCount: 0,
  invitedBy: '',
  unlockedCards: [], // 服务端授予的限定卡面 key（如 invited_limited / recruiter）
};

const DEFAULT_AGENT_CONFIG = {
  projectContext: true,
  techStack: true,
  identityCard: true,
  matchResults: true,
};

/** 全站统一的用户档案默认值（替代各页面散落的硬编码 mock） */
const DEFAULT_PROFILE = {
  nickname: '',
  role: '',
  city: '',
  bio: '',
  skills: [],
  github: '',
  avatarUrl: '',
  publicId: '',
};

function getPortfolioProjects() {
  const scan = getScanResults();
  const project = scan && scan.project && typeof scan.project === 'object' ? scan.project : null;
  if (!project || !(project.name || project.summary || project.description)) return [];
  const firstMatch = Array.isArray(scan.matches) && scan.matches.length ? scan.matches[0] : null;
  const tags = Array.isArray(project.techStack) && project.techStack.length
    ? project.techStack.slice(0, 6)
    : (Array.isArray(project.tags) ? project.tags.slice(0, 6) : []);
  return [{
    id: project.id || `sync-${scan.syncedAt || 'project'}`,
    name: project.name || '未命名项目',
    subtitle: project.summary || project.description || '来自 Skills 同步的项目画像',
    event: firstMatch ? (firstMatch.name || firstMatch.hackathonId || '匹配赛事') : '未关联赛事',
    status: scan.syncedAt ? '已同步' : '待完善',
    tags,
    syncedAt: scan.syncedAt || 0,
  }];
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

function getAuth() {
  const app = getApp();
  const local = app && app.globalData ? app.globalData.auth : null;
  if (local && local.openid && local.userInfo) return local;
  const cached = getStorage('ht_auth', null);
  if (cached && cached.openid && cached.userInfo) {
    if (app && app.globalData) app.globalData.auth = cached;
    return cached;
  }
  if (cached || local) clearUserSession();
  return null;
}

function setAuth(auth) {
  const app = getApp();
  if (app && app.globalData) app.globalData.auth = auth || null;
  if (auth) setStorage('ht_auth', auth);
  else {
    try { wx.removeStorageSync('ht_auth'); } catch (e) {}
  }
}

function clearUserSession() {
  setAuth(null);
  [
    STORAGE.CARDS,
    STORAGE.BOOKMARKS,
    STORAGE.REGISTRATIONS,
    STORAGE.SCAN_RESULTS,
    STORAGE.AGENT_CONFIG,
    STORAGE.PROFILE,
    STORAGE.GROWTH,
  ].forEach((key) => {
    try { wx.removeStorageSync(key); } catch (e) {}
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

function hasUserSession() {
  return !!getAuth();
}

function needsAvatarUpload(url) {
  const value = String(url || '');
  if (!value) return false;
  if (value.indexOf('cloud://') === 0) return false;
  if (/^https?:\/\//i.test(value) && value.indexOf('http://tmp/') !== 0 && value.indexOf('https://tmp/') !== 0) {
    return false;
  }
  return true;
}

function avatarExt(url) {
  const match = String(url || '').split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const ext = match && match[1] ? match[1].toLowerCase() : 'png';
  return ['jpg', 'jpeg', 'png', 'webp'].indexOf(ext) !== -1 ? ext : 'png';
}

function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      filePath,
      cloudPath,
      success: resolve,
      fail: reject,
    });
  });
}

async function uploadAvatarIfNeeded(profile) {
  const next = Object.assign({}, profile || {});
  if (!cloudReady() || !wx.cloud.uploadFile || !needsAvatarUpload(next.avatarUrl)) return next;

  const ext = avatarExt(next.avatarUrl);
  const rand = Math.random().toString(36).slice(2, 8);
  const cloudPath = `avatars/${Date.now()}-${rand}.${ext}`;
  const uploaded = await uploadFile(next.avatarUrl, cloudPath);
  if (uploaded && uploaded.fileID) next.avatarUrl = uploaded.fileID;
  return next;
}

/* ----------------------------- 黑客松 ----------------------------- */

/** 本地筛选/排序，模拟云函数行为 */
function filterLocal(list, params) {
  params = params || {};
  let r = list.filter((h) => h && h.isPublished !== false);
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
  let cloudResponded = false;

  if (cloudReady()) {
    try {
      const res = await callFn('getHackathonDetail', { id });
      cloudResponded = !!(res && typeof res.ok === 'boolean');
      if (res && res.hackathon) raw = res.hackathon;
    } catch (e) {
      console.warn('[api] getHackathonDetail 云端失败，降级本地', e);
    }
  }
  if (cloudResponded && !raw) return null;
  if (!raw) raw = LOCAL_HACKATHONS.find((h) => h.id === id) || null;

  return raw ? catalog.decorate(raw, today) : null;
}

/** 赛事热度（F3）：报名/收藏聚合。mock 时用 id 派生稳定的拟真数值 + 叠加本人行为 */
async function getHackathonHeat(id) {
  const key = String(id || '').trim();
  if (!key) return { ok: false, message: '缺少赛事 id' };
  if (cloudReady()) {
    try {
      const res = await callFn('getHackathonHeat', { id: key });
      if (res && res.ok) return res;
    } catch (e) {
      console.warn('[api] getHackathonHeat 云端失败，降级本地', e);
    }
  }
  // 本地派生：稳定 hash → 拟真热度，叠加本人收藏/报名，使开发者工具可演示
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) { hash = ((hash << 5) - hash) + key.charCodeAt(i); hash |= 0; }
  hash = Math.abs(hash);
  const baseRegs = 6 + (hash % 40);
  const baseMarks = 10 + ((hash >> 3) % 80);
  const mineReg = getRegistrations().some((r) => r.id === key) ? 1 : 0;
  const mineMark = isBookmarked(key) ? 1 : 0;
  const registrations = baseRegs + mineReg;
  const bookmarks = baseMarks + mineMark;
  return { ok: true, local: true, id: key, registrations, bookmarks, fans: registrations + bookmarks, heat: registrations * 3 + bookmarks };
}

/* ----------------------------- 收藏 / 报名 ----------------------------- */

function getBookmarks() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.BOOKMARKS, []);
  return Array.isArray(v) ? v : [];
}
function isBookmarked(id) {
  return getBookmarks().indexOf(id) !== -1;
}
async function toggleBookmark(id) {
  if (!cloudReady()) throw new Error('需要连接云开发后才能同步收藏');
  const prev = getBookmarks();
  const list = prev.slice();
  const i = list.indexOf(id);
  const active = i === -1;
  if (i === -1) list.push(id); else list.splice(i, 1);
  setStorage(STORAGE.BOOKMARKS, list);
  if (cloudReady()) {
    try {
      const res = await callFn('toggleBookmark', { id, active });
      if (!res || !res.ok) throw new Error((res && res.message) || '收藏同步失败');
    } catch (e) {
      setStorage(STORAGE.BOOKMARKS, prev);
      throw e;
    }
  }
  return active; // true=已收藏
}
async function getBookmarkedHackathons() {
  const ids = getBookmarks();
  const all = await getHackathons({});
  return all.filter((h) => ids.indexOf(h.id) !== -1);
}

function getRegistrations() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.REGISTRATIONS, []);
  return Array.isArray(v) ? v : [];
}
async function addRegistration(item) {
  if (!cloudReady()) throw new Error('需要连接云开发后才能加入赛程');
  const prev = getRegistrations();
  const list = prev.slice();
  if (!list.find((x) => x.id === item.id)) {
    list.unshift(Object.assign({ registeredAt: Date.now() }, item));
    setStorage(STORAGE.REGISTRATIONS, list);
    if (cloudReady()) {
      try {
        const res = await callFn('addRegistration', { item });
        if (!res || !res.ok) throw new Error((res && res.message) || '赛程同步失败');
      } catch (e) {
        setStorage(STORAGE.REGISTRATIONS, prev);
        throw e;
      }
    }
  }
  return list;
}
async function removeRegistration(id) {
  if (!cloudReady()) throw new Error('需要连接云开发后才能取消赛程');
  const prev = getRegistrations();
  const list = prev.filter((item) => item.id !== id);
  if (list.length === prev.length) return list;
  setStorage(STORAGE.REGISTRATIONS, list);
  if (cloudReady()) {
    try {
      const res = await callFn('addRegistration', { action: 'remove', id });
      if (!res || !res.ok) throw new Error((res && res.message) || '取消赛程同步失败');
    } catch (e) {
      setStorage(STORAGE.REGISTRATIONS, prev);
      throw e;
    }
  }
  return list;
}

/* ----------------------------- 卡片 ----------------------------- */

function getCards() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.CARDS, []);
  return Array.isArray(v) ? v : [];
}

function cacheCard(card) {
  if (!card || !card.id) return null;
  const prev = getCards();
  const list = prev.slice();
  const idx = list.findIndex((c) => c.id === card.id);
  const stamped = Object.assign({ updatedAt: Date.now() }, card);
  if (idx === -1) list.unshift(stamped); else list[idx] = stamped;
  setStorage(STORAGE.CARDS, list);
  return { prev, stamped };
}

async function saveCard(card) {
  if (!card || !card.id) throw new Error('缺少身份卡数据');
  if (!cloudReady()) throw new Error('需要连接云开发后才能保存身份卡');
  const { prev, stamped } = cacheCard(card);
  if (cloudReady()) {
    try {
      const res = await callFn('saveCard', { card: stamped });
      if (!res || !res.ok) throw new Error((res && res.message) || '身份卡同步失败');
    } catch (e) {
      setStorage(STORAGE.CARDS, prev);
      throw e;
    }
  }
  return stamped;
}
function getCardById(id) {
  return getCards().find((c) => c.id === id) || null;
}

/* ----------------------------- 用户档案 ----------------------------- */

/** 读取统一用户档案，缺字段用默认值补齐，永不返回 null */
function getProfile() {
  if (!hasUserSession()) return Object.assign({}, DEFAULT_PROFILE);
  const v = getStorage(STORAGE.PROFILE, null);
  return Object.assign({}, DEFAULT_PROFILE, v && typeof v === 'object' ? v : {});
}
function mergeProfile(patch) {
  return Object.assign({}, getProfile(), patch || {});
}

async function saveProfileWithSync(patch, alreadyMerged) {
  const prev = getProfile();
  let next = alreadyMerged ? Object.assign({}, patch || {}) : mergeProfile(patch);
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能同步身份资料' };
  }

  try {
    next = await uploadAvatarIfNeeded(next);
    const res = await callFn('saveProfile', { profile: next });
    if (res && res.ok) {
      const profile = Object.assign({}, prev, next, {
        avatarUrl: next.avatarUrl || '',
        publicId: res.publicId || next.publicId || '',
      });
      setStorage(STORAGE.PROFILE, profile);
      return { ok: true, profile, result: res };
    }
    setStorage(STORAGE.PROFILE, prev);
    return res || { ok: false, message: '身份资料保存失败' };
  } catch (e) {
    setStorage(STORAGE.PROFILE, prev);
    throw e;
  }
}

/** 合并保存用户档案（patch 部分更新），同步 best-effort 上云 */
function saveProfile(patch) {
  const next = mergeProfile(patch);
  setStorage(STORAGE.PROFILE, next);
  if (cloudReady()) {
    saveProfileWithSync(next, true)
      .catch(() => {});
  }
  return next;
}

async function getProfileQr(profile) {
  if (!cloudReady()) return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后生成小程序码' };
  try {
    const prepared = await uploadAvatarIfNeeded(profile || getProfile());
    if (prepared.avatarUrl) setStorage(STORAGE.PROFILE, Object.assign({}, getProfile(), { avatarUrl: prepared.avatarUrl }));
    const res = await callFn('getProfileQr', { profile: prepared });
    if (res && res.ok && res.uid) {
      setStorage(STORAGE.PROFILE, Object.assign({}, getProfile(), { publicId: res.uid }));
    }
    return res || { ok: false, message: '小程序码生成失败' };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

async function getPublicProfile(uid) {
  const id = String(uid || '').trim();
  if (!id) return { ok: false, message: '缺少用户 id' };
  if (cloudReady()) {
    try {
      const res = await callFn('getPublicProfile', { uid: id });
      if (res && res.ok) return res;
      return res || { ok: false, message: '公开主页不存在' };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }

  const profile = getProfile();
  const stats = getUserStats();
  return {
    ok: true,
    local: true,
    profile: {
      uid: id,
      name: profile.nickname,
      role: profile.role,
      city: profile.city,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      github: profile.github,
      skills: profile.skills || [],
      stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
    },
    projects: getPortfolioProjects().map((item) => ({ name: item.name, desc: item.subtitle || item.desc || '' })),
  };
}
/** 由真实收藏/报名/卡片数量派生用户资产统计，供个人中心/公开主页/分享复用 */
function getUserStats() {
  const profile = getProfile();
  return {
    hackathons: getRegistrations().length,
    bookmarks: getBookmarks().length,
    projects: getPortfolioProjects().length,
    skills: Array.isArray(profile.skills) ? profile.skills.length : 0,
  };
}

/* ----------------------------- 组织者 ----------------------------- */

const PROFILE_MODES = ['participant', 'organizer'];
const ORGANIZER_STATUSES = ['none', 'pending', 'approved', 'rejected'];

function normalizeProfileMode(mode) {
  return PROFILE_MODES.indexOf(mode) !== -1 ? mode : 'participant';
}

function getProfileMode() {
  return normalizeProfileMode(getStorage(STORAGE.PROFILE_MODE, 'participant'));
}

function setProfileMode(mode) {
  const next = normalizeProfileMode(mode);
  setStorage(STORAGE.PROFILE_MODE, next);
  return next;
}

function getOrganizerApplication() {
  if (!hasUserSession()) {
    return {
      status: 'none',
      orgName: '',
      role: '',
      contact: '',
      website: '',
      note: '',
      submittedAt: 0,
      reviewedAt: 0,
      approvalSource: '',
    };
  }
  const v = getStorage(STORAGE.ORGANIZER, null);
  const base = {
    status: 'none',
    orgName: '',
    role: '',
    contact: '',
    website: '',
    note: '',
    submittedAt: 0,
    reviewedAt: 0,
    approvalSource: '',
  };
  if (!v || typeof v !== 'object') {
    return base;
  }
  const next = Object.assign({}, base, v);
  if (ORGANIZER_STATUSES.indexOf(next.status) === -1) next.status = 'none';
  // 本地 storage 只作为 UI 缓存，不能自己把组织者改成 approved 解锁发布。
  if (next.status === 'approved' && next.approvalSource !== 'server') {
    next.status = next.submittedAt ? 'pending' : 'none';
    next.reviewedAt = 0;
  }
  return next;
}

function saveOrganizerApplication(form) {
  const next = Object.assign({}, getOrganizerApplication(), form || {}, {
    status: 'pending',
    approvalSource: '',
    submittedAt: Date.now(),
    reviewedAt: 0,
  });
  setStorage(STORAGE.ORGANIZER, next);
  return next;
}

async function submitOrganizerApplication(form) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能提交组织者申请' };
  }
  try {
    const res = await callFn('submitOrganizerApplication', { form });
    if (res && res.ok) {
      const next = Object.assign({}, getOrganizerApplication(), form || {}, {
        status: res.status || 'pending',
        approvalSource: 'server',
        submittedAt: Date.now(),
        reviewedAt: 0,
      });
      setStorage(STORAGE.ORGANIZER, next);
    }
    return res || { ok: false, code: 'EMPTY_RESPONSE', message: '提交组织者申请失败' };
  } catch (e) {
    return { ok: false, code: 'SUBMIT_FAILED', message: String(e) };
  }
}

function isOrganizerApproved() {
  const app = getOrganizerApplication();
  return app.status === 'approved' && app.approvalSource === 'server';
}

function getHackathonDrafts() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.HACKATHON_DRAFTS, []);
  return Array.isArray(v) ? v : [];
}

function saveHackathonDraft(form) {
  const drafts = getHackathonDrafts();
  const draft = Object.assign({}, form || {}, {
    id: `draft-${Date.now()}`,
    status: 'pending_review',
    submittedAt: Date.now(),
  });
  drafts.unshift(draft);
  setStorage(STORAGE.HACKATHON_DRAFTS, drafts);
  return draft;
}

function cacheHackathonDraft(form, remote) {
  const drafts = getHackathonDrafts();
  const draft = Object.assign({}, form || {}, {
    id: remote && remote.id ? remote.id : `draft-${Date.now()}`,
    status: remote && remote.status ? remote.status : 'pending_manual_review',
    security: remote && remote.security ? remote.security : null,
    submittedAt: Date.now(),
  });
  drafts.unshift(draft);
  setStorage(STORAGE.HACKATHON_DRAFTS, drafts);
  return draft;
}

async function submitHackathonDraft(form) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能提交审核' };
  }
  try {
    const res = await callFn('submitHackathonDraft', { form });
    if (res && res.ok) cacheHackathonDraft(form, res);
    return res || { ok: false, code: 'EMPTY_RESPONSE', message: '提交审核失败' };
  } catch (e) {
    return { ok: false, code: 'SUBMIT_FAILED', message: String(e) };
  }
}

/* ----------------------------- 管理员赛事管理 ----------------------------- */

async function adminHackathonManage(action, payload) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能管理赛事' };
  }
  try {
    return await callFn('adminHackathonManage', Object.assign({ action }, payload || {}));
  } catch (e) {
    return { ok: false, code: 'ADMIN_MANAGE_FAILED', message: String(e) };
  }
}

async function checkHackathonAdmin() {
  if (!cloudReady() || !isLoggedIn()) return { ok: false, isAdmin: false, skipped: true };
  const res = await adminHackathonManage('check', {});
  return res || { ok: false, isAdmin: false };
}

/* --------------------- 裂变成长态 / 暗号（F1） --------------------- */

function getGrowth() {
  if (!hasUserSession()) return Object.assign({}, DEFAULT_GROWTH);
  const v = getStorage(STORAGE.GROWTH, null);
  return Object.assign({}, DEFAULT_GROWTH, v && typeof v === 'object' ? v : {});
}

function setGrowth(patch) {
  const next = Object.assign({}, getGrowth(), patch || {});
  setStorage(STORAGE.GROWTH, next);
  return next;
}

/** 本地兜底暗号：未连云开发时，由 publicId/openid 派生一个稳定的 HT-XXXX */
function localInviteCode() {
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const seed = (getProfile().publicId || (getAuth() && getAuth().openid) || 'guest') + '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);
  let s = '';
  for (let i = 0; i < 4; i += 1) {
    s += ALPHABET[hash % ALPHABET.length];
    hash = Math.floor(hash / ALPHABET.length) + 7;
  }
  return `HT-${s}`;
}

/** 取/建当前用户的专属暗号；返回 { ok, code, recruitScore, redeemCount } */
async function getInviteCode() {
  if (cloudReady() && isLoggedIn()) {
    try {
      const res = await callFn('inviteCode', {});
      if (res && res.ok && res.code) {
        setGrowth({ inviteCode: res.code, recruitScore: res.recruitScore || 0, redeemCount: res.redeemCount || 0 });
        return res;
      }
    } catch (e) {
      console.warn('[api] inviteCode 云端失败，降级本地', e);
    }
  }
  const code = getGrowth().inviteCode || localInviteCode();
  const g = setGrowth({ inviteCode: code });
  return { ok: true, local: true, code, recruitScore: g.recruitScore, redeemCount: g.redeemCount };
}

/**
 * 核销好友暗号：绑定 referral + 双向解锁，返回邀请人画像（供 Haki 组队雷达）。
 * @returns {Promise<{ok, firstTime?, alreadyRedeemed?, inviter?, unlocked?, ownerUnlocked?, message?}>}
 */
async function redeemInvite(code) {
  const clean = String(code || '').toUpperCase().trim();
  if (cloudReady() && isLoggedIn()) {
    try {
      const res = await callFn('redeemInvite', { code: clean });
      // 云函数返回了结构化结果（含校验失败 NOT_FOUND/SELF 等）→ 直接透出
      if (res && typeof res.ok === 'boolean') {
        if (res.ok && res.firstTime && Array.isArray(res.unlocked) && res.unlocked.length) {
          const g = getGrowth();
          const merged = Array.from(new Set((g.unlockedCards || []).concat(res.unlocked)));
          setGrowth({ unlockedCards: merged });
        }
        return res;
      }
      // 无结构化结果 → 落到下方 mock 演示
    } catch (e) {
      // 云函数未部署/网络异常 → 落到下方 mock 演示，保证体验不中断
      console.warn('[api] redeemInvite 云端不可用，降级演示', e);
    }
  }
  // mock 降级：构造一个示例邀请人，保证开发者工具可演示完整体验
  if (clean === getGrowth().inviteCode) {
    return { ok: false, code: 'SELF', message: '这是你自己的暗号，发给朋友才有用～' };
  }
  if (!/^HT-?[0-9A-Z]{4}$/.test(clean)) {
    return { ok: false, code: 'BAD_FORMAT', message: '暗号格式不对，应该像 HT-7K3D' };
  }
  setGrowth({ unlockedCards: Array.from(new Set(getGrowth().unlockedCards.concat('invited_limited'))) });
  return {
    ok: true,
    local: true,
    firstTime: true,
    inviter: { name: '示例队友 Neo', role: 'model_alchemist', city: '上海', skills: ['PyTorch', 'LangChain', 'RAG'], recruitScore: 2 },
    unlocked: ['invited_limited'],
    ownerUnlocked: [],
  };
}

/* ----------------------------- AI 聊天 ----------------------------- */

/**
 * Haki AI 问答：调 aiChat 云函数（混元），失败/未配置云开发时降级兜底文案。
 * @param {string} message 用户当前问题
 * @param {Array<{role,text}>} history 对话历史（仅 user/assistant）
 * @returns {Promise<{ok:boolean, reply:string, fallback?:boolean}>}
 */
async function aiChat(message, history, focusEventId, extra) {
  const text = String(message || '').trim();
  if (!text) return { ok: false, reply: '说点什么吧，比如"我会 React，适合参加哪个？"', fallback: true };

  if (cloudReady()) {
    try {
      const payload = {
        message: text,
        focusEventId: focusEventId || '',
        agentConfig: getAgentConfig(),
        inviteContext: (extra && extra.inviteContext) || null,
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
  if (!hasUserSession()) return null;
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

function getAgentConfig() {
  if (!hasUserSession()) return Object.assign({}, DEFAULT_AGENT_CONFIG);
  const v = getStorage(STORAGE.AGENT_CONFIG, null);
  return Object.assign({}, DEFAULT_AGENT_CONFIG, v && typeof v === 'object' ? v : {});
}

function setAgentConfig(patch, options) {
  const next = Object.assign({}, getAgentConfig(), patch || {});
  setStorage(STORAGE.AGENT_CONFIG, next);
  if (!(options && options.skipSync) && cloudReady()) {
    callFn('saveAgentConfig', { agentConfig: next }).catch((e) => {
      console.warn('[api] Agent 配置云端同步失败', e);
    });
  }
  return next;
}

async function saveAgentConfig(patch) {
  const prev = getAgentConfig();
  const next = Object.assign({}, getAgentConfig(), patch || {});
  setStorage(STORAGE.AGENT_CONFIG, next);
  if (!cloudReady()) {
    setStorage(STORAGE.AGENT_CONFIG, prev);
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能同步 Agent 配置' };
  }
  try {
    const res = await callFn('saveAgentConfig', { agentConfig: next });
    if (res && res.ok && res.agentConfig) {
      setStorage(STORAGE.AGENT_CONFIG, Object.assign({}, DEFAULT_AGENT_CONFIG, res.agentConfig));
    } else if (!res || !res.ok) {
      setStorage(STORAGE.AGENT_CONFIG, prev);
    }
    return res || { ok: false, message: 'Agent 配置同步失败' };
  } catch (e) {
    setStorage(STORAGE.AGENT_CONFIG, prev);
    throw e;
  }
}

/**
 * 为当前登录用户创建一次性 Skills 同步配对会话。
 * 返回 { code, uploadToken, expireAt }，uploadToken 只用于本次桌面端上传。
 */
async function createSyncPair() {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能生成配对码' };
  }
  try {
    const res = await callFn('pairSync', { action: 'create' });
    return res || { ok: false, message: '配对码生成失败' };
  } catch (e) {
    return { ok: false, code: 'PAIR_CREATE_FAILED', message: '配对码生成失败，请稍后重试' };
  }
}

/**
 * 提交配对码，从云端拉取 CLI/网页端推送的 Skills 同步内容。
 * 上线产品不再把 mock 当成功；必须云端拉取成功才算同步完成。
 */
async function pullSyncByCode(code) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能同步 Skills' };
  }
  try {
    const res = await callFn('pairSync', { code, action: 'pull' });
    if (res && res.ok) {
      // pairSync 云函数已经把 card 绑定到当前 openid；前端这里只刷新本地缓存。
      if (res.card) cacheCard(res.card);
      if (res.scan) setScanResults(res.scan);
      return res;
    }
    return res || { ok: false, message: '配对码无效或已过期' };
  } catch (e) {
    return { ok: false, code: 'SYNC_FAILED', message: '同步失败，请确认配对码仍有效并稍后重试' };
  }
}

/* ----------------------------- 登录态 / 云同步 ----------------------------- */

/** 是否已登录（globalData.auth 有 userInfo） */
function isLoggedIn() {
  const auth = getAuth();
  return !!(auth && auth.openid);
}

async function loginWithUserInfo(userInfo) {
  const app = getApp();
  const info = userInfo || {};
  if (!(app && app.globalData && app.globalData.cloudReady && wx.cloud)) {
    throw new Error('需要连接云开发后才能微信登录');
  }
  const res = await callFn('login', { userInfo: info });
  if (!res || !res.ok || !res.openid) throw new Error((res && res.message) || '微信登录失败');
  const openid = res.openid;

  const auth = { openid, userInfo: info, loginAt: Date.now() };
  setAuth(auth);
  await saveProfileWithSync({
    nickname: info.nickName || info.nickname || getProfile().nickname,
    avatarUrl: info.avatarUrl || getProfile().avatarUrl,
  }).catch(() => {});
  await syncFromCloud().catch(() => {});
  return auth;
}

/**
 * 写操作前的登录守卫：优先打开当前页面的 auth-modal，缺少组件时降级弹窗跳登录页。
 * @param {object|string} pageOrRedirect 当前 Page 实例，兼容旧式 redirect 字符串
 * @param {string} redirectPage 当前页完整路径(含参数)
 * @param {string} reason 登录用途说明
 */
async function requireAuth(pageOrRedirect, redirectPage, reason) {
  if (isLoggedIn()) return getAuth();
  const page = pageOrRedirect && typeof pageOrRedirect === 'object' ? pageOrRedirect : null;
  const redirect = page ? redirectPage : pageOrRedirect;
  if (page && page.selectComponent) {
    const modal = page.selectComponent('#authModal');
    if (modal && modal.open) {
      return modal.open({ reason });
    }
  }
  const url = redirect
    ? '/pages/login/login?redirect=' + encodeURIComponent(redirect)
    : '/pages/login/login';
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要微信登录',
      content: reason || '登录后可以同步身份信息、赛程和身份卡。',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url });
        resolve(null);
      },
      fail: () => resolve(null),
    });
  });
}

/** 登录后从云端拉取收藏/报名/卡片/同步结果，合并进本地 storage(云端为准) */
async function syncFromCloud() {
  if (!cloudReady() || !isLoggedIn()) return { ok: false, skipped: true };
  try {
    const res = await callFn('getProfile', {});
    if (res && res.ok) {
      if (Array.isArray(res.bookmarkIds)) setStorage(STORAGE.BOOKMARKS, res.bookmarkIds);
      if (Array.isArray(res.registrations)) setStorage(STORAGE.REGISTRATIONS, res.registrations);
      if (Array.isArray(res.cards)) setStorage(STORAGE.CARDS, res.cards);
      if (res.profile && typeof res.profile === 'object') {
        setStorage(STORAGE.PROFILE, Object.assign({}, getProfile(), res.profile));
      }
      if (res.agentConfig && typeof res.agentConfig === 'object') {
        setStorage(STORAGE.AGENT_CONFIG, Object.assign({}, DEFAULT_AGENT_CONFIG, res.agentConfig));
      }
      if (res.scan) setScanResults(res.scan);
      if (res.organizerApplication && typeof res.organizerApplication === 'object') {
        setStorage(STORAGE.ORGANIZER, res.organizerApplication);
      }
      return { ok: true };
    }
  } catch (e) {
    console.warn('[api] syncFromCloud 失败', e);
  }
  return { ok: false };
}

async function syncUserDataIfLoggedIn() {
  if (!isLoggedIn()) return { ok: false, skipped: true };
  return syncFromCloud();
}

module.exports = {
  STORAGE,
  cloudReady,
  getAuth,
  setAuth,
  clearUserSession,
  isLoggedIn,
  loginWithUserInfo,
  requireAuth,
  syncFromCloud,
  syncUserDataIfLoggedIn,
  getHackathons,
  getHackathonDetail,
  getHackathonHeat,
  getBookmarks,
  isBookmarked,
  toggleBookmark,
  getBookmarkedHackathons,
  getRegistrations,
  addRegistration,
  removeRegistration,
  getCards,
  saveCard,
  getCardById,
  getProfile,
  saveProfile,
  saveProfileWithSync,
  getProfileQr,
  getPublicProfile,
  getUserStats,
  getProfileMode,
  setProfileMode,
  getOrganizerApplication,
  saveOrganizerApplication,
  submitOrganizerApplication,
  isOrganizerApproved,
  getHackathonDrafts,
  saveHackathonDraft,
  submitHackathonDraft,
  adminHackathonManage,
  checkHackathonAdmin,
  getPortfolioProjects,
  getScanResults,
  setScanResults,
  getAgentConfig,
  setAgentConfig,
  saveAgentConfig,
  createSyncPair,
  pullSyncByCode,
  aiChat,
  getGrowth,
  setGrowth,
  getInviteCode,
  redeemInvite,
};
