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
const ENV = require('../env.js');

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
  SUBSCRIPTIONS: 'ht_message_subscriptions', // 微信订阅消息授权记录
  EVENT_CHECKINS: 'ht_event_checkins', // 活动签到缓存
  EVENT_PROFILES: 'ht_event_profiles', // 活动内身份缓存
  EVENT_MEMBERS: 'ht_event_members', // 活动成员缓存
  ACHIEVEMENTS: 'ht_achievements', // 主办方验证履历缓存
};

const SUBSCRIBE_TYPES = {
  NEW_HACKATHON: 'new_hackathon',
  SMART_RECOMMENDATION: 'smart_recommendation',
  DEADLINE_REMINDER: 'deadline_reminder',
};

const SUBSCRIBE_TYPE_LABELS = {
  [SUBSCRIBE_TYPES.NEW_HACKATHON]: '黑客松上新',
  [SUBSCRIBE_TYPES.SMART_RECOMMENDATION]: '智能推荐',
  [SUBSCRIBE_TYPES.DEADLINE_REMINDER]: '截止提醒',
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
  projects: [],
  experiences: [],
  hackathonHistory: [],
  awards: [],
  teamPreference: {
    lookingFor: [],
    projectIdea: '',
    availability: '',
    openToMeet: true,
  },
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
    STORAGE.SUBSCRIPTIONS,
    STORAGE.EVENT_CHECKINS,
    STORAGE.EVENT_PROFILES,
    STORAGE.EVENT_MEMBERS,
    STORAGE.ACHIEVEMENTS,
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

function mergeById(primary, secondary) {
  const merged = [];
  const seen = {};
  (primary || []).concat(secondary || []).forEach((item) => {
    if (!item || !item.id || seen[item.id]) return;
    seen[item.id] = true;
    merged.push(item);
  });
  return merged;
}

function mergeIds(primary, secondary) {
  return Array.from(new Set((primary || []).concat(secondary || []).filter(Boolean)));
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
  return getLocalHackathonHeat(key);
}

function getLocalHackathonHeat(id) {
  const key = String(id || '').trim();
  if (!key) return { ok: false, message: '缺少赛事 id' };
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

function collectRecommendationSignals() {
  const profile = getProfile();
  const scan = getScanResults();
  const project = scan && scan.project && typeof scan.project === 'object' ? scan.project : null;
  const values = [];

  if (Array.isArray(profile.skills)) values.push(...profile.skills);
  if (profile.role) values.push(profile.role);
  if (project) {
    if (Array.isArray(project.techStack)) values.push(...project.techStack);
    if (Array.isArray(project.tags)) values.push(...project.tags);
    if (project.summary) values.push(project.summary);
    if (project.description) values.push(project.description);
  }

  return Array.from(new Set(values
    .map((item) => String(item || '').trim())
    .filter(Boolean)))
    .slice(0, 16);
}

function scoreHackathonForSignals(item, signals) {
  const haystack = [
    item.name,
    item.shortName,
    item.theme,
    item.summary,
    ...(item.tracks || []),
    ...(item.techStack || []),
    ...(item.tags || []),
  ].join(' ').toLowerCase();
  let score = 0;
  const hits = [];
  signals.forEach((signal) => {
    const key = String(signal || '').trim();
    if (!key) return;
    if (haystack.indexOf(key.toLowerCase()) !== -1) {
      score += 1;
      hits.push(key);
    }
  });
  return { score, hits: hits.slice(0, 3) };
}

async function getRecommendedHackathons(options) {
  const opts = options || {};
  const signals = collectRecommendationSignals();
  const profile = getProfile();
  const city = opts.city && opts.city !== '全国' ? opts.city : (profile.city || '');
  const limit = Math.max(1, Math.min(Number(opts.limit) || 4, 10));

  if (signals.length && cloudReady()) {
    try {
      const res = await callFn('matchHackathonsByStack', {
        techStack: signals,
        city,
        limit,
        onlyUpcoming: true,
      });
      const raw = res && res.ok && res.data && Array.isArray(res.data.list) ? res.data.list : [];
      if (raw.length) {
        const today = catalog.formatDate(new Date());
        return {
          ok: true,
          personalized: true,
          signals,
          list: raw.map((item) => catalog.decorate(item, today)),
        };
      }
    } catch (e) {
      console.warn('[api] matchHackathonsByStack 云端失败，降级本地', e);
    }
  }

  const all = Array.isArray(opts.source) && opts.source.length ? opts.source : await getHackathons({});
  if (!signals.length) {
    return {
      ok: true,
      personalized: false,
      needsProfile: true,
      signals,
      message: '完善技能、GitHub 或完成 Skills 同步后，会生成更精准推荐。',
      list: all.slice(0, limit),
    };
  }

  const scored = all
    .map((item) => {
      const result = scoreHackathonForSignals(item, signals);
      return Object.assign({}, item, {
        matchScore: result.score,
        matchedTags: result.hits,
        fitReason: result.hits.length ? `匹配你的 ${result.hits.join(' / ')} 方向` : '',
      });
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    ok: true,
    personalized: scored.length > 0,
    needsProfile: false,
    signals,
    message: scored.length ? '' : '暂时没有明显匹配，先展示近期可报名赛事。',
    list: (scored.length ? scored : all).slice(0, limit),
  };
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
      console.warn('[api] toggleBookmark 云端失败，保留本地订阅状态', e);
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
        console.warn('[api] addRegistration 云端失败，保留本地赛程', e);
      }
    }
  }
  return list;
}
async function removeRegistration(id) {
  const prev = getRegistrations();
  const list = prev.filter((item) => item.id !== id);
  if (list.length === prev.length) return list;
  setStorage(STORAGE.REGISTRATIONS, list);
  if (cloudReady()) {
    try {
      const res = await callFn('addRegistration', { action: 'remove', id });
      if (!res || !res.ok) throw new Error((res && res.message) || '取消赛程同步失败');
    } catch (e) {
      console.warn('[api] removeRegistration 云端失败，保留本地移除状态', e);
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
    works: [],
  };
}

async function reviewWork(data) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能管理作品' };
  }
  try {
    const res = await callFn('reviewWork', data || {});
    return res || { ok: false, code: 'EMPTY_RESPONSE', message: '作品操作失败' };
  } catch (e) {
    return { ok: false, code: 'REVIEW_WORK_FAILED', message: '作品操作失败，请稍后重试' };
  }
}

async function listReviewWorks() {
  return reviewWork({ action: 'list' });
}

async function updateReviewWork(action, workId) {
  return reviewWork({ action, workId });
}

/** 由真实收藏/报名/卡片数量派生用户资产统计，供个人中心/公开主页/分享复用 */
function getUserStats() {
  const profile = getProfile();
  const verified = getLocalAchievements().filter((item) => item && item.verified).length;
  return {
    hackathons: getRegistrations().length,
    bookmarks: getBookmarks().length,
    projects: getPortfolioProjects().length,
    skills: Array.isArray(profile.skills) ? profile.skills.length : 0,
    verifiedAchievements: verified,
  };
}

/* ----------------------------- 活动身份 / 签到 ----------------------------- */

function cleanString(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 500);
}

function cleanStringList(value, maxItems, maxLength) {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string') list = value.split(/[,\n，、\/]/);
  return list
    .map((item) => cleanString(item, maxLength || 40))
    .filter((item) => item)
    .slice(0, maxItems || 12);
}

function getEventCheckins() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.EVENT_CHECKINS, []);
  return Array.isArray(v) ? v : [];
}

function setEventCheckins(list) {
  setStorage(STORAGE.EVENT_CHECKINS, Array.isArray(list) ? list : []);
}

function getLocalEventProfiles() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.EVENT_PROFILES, []);
  return Array.isArray(v) ? v : [];
}

function setLocalEventProfiles(list) {
  setStorage(STORAGE.EVENT_PROFILES, Array.isArray(list) ? list : []);
}

function getLocalAchievements() {
  if (!hasUserSession()) return [];
  const v = getStorage(STORAGE.ACHIEVEMENTS, []);
  return Array.isArray(v) ? v : [];
}

function setLocalAchievements(list) {
  setStorage(STORAGE.ACHIEVEMENTS, Array.isArray(list) ? list : []);
}

function normalizeEventProfile(profilePatch) {
  const profile = getProfile();
  const pref = profile.teamPreference && typeof profile.teamPreference === 'object' ? profile.teamPreference : {};
  const patch = profilePatch && typeof profilePatch === 'object' ? profilePatch : {};
  return {
    displayName: cleanString(patch.displayName || profile.nickname, 40),
    role: cleanString(patch.role || profile.role || '参赛者', 40),
    city: cleanString(patch.city || profile.city, 40),
    skills: cleanStringList(patch.skills && patch.skills.length ? patch.skills : profile.skills, 16, 40),
    projectIdea: cleanString(patch.projectIdea || pref.projectIdea, 240),
    lookingFor: cleanStringList(patch.lookingFor && patch.lookingFor.length ? patch.lookingFor : pref.lookingFor, 8, 40),
    availability: cleanString(patch.availability || pref.availability, 80),
    openToMeet: patch.openToMeet === false ? false : pref.openToMeet !== false,
    contactHint: cleanString(patch.contactHint, 80),
  };
}

function upsertByEventId(list, eventId, patch) {
  const source = Array.isArray(list) ? list.slice() : [];
  const idx = source.findIndex((item) => item && item.eventId === eventId);
  const next = Object.assign({}, idx >= 0 ? source[idx] : {}, patch || {}, { eventId });
  if (idx >= 0) source[idx] = next;
  else source.unshift(next);
  return { list: source, item: next };
}

async function getEventSummary(eventId) {
  const item = await getHackathonDetail(eventId).catch(() => null);
  return item ? {
    id: item.id || eventId,
    name: item.name || '未命名黑客松',
    city: item.city || item.location || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    modeText: item.modeText || item.mode || '',
  } : { id: eventId, name: '活动现场', city: '', startDate: '', endDate: '', modeText: '' };
}

async function eventHub(action, payload) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能同步活动数据' };
  }
  try {
    return await callFn('eventHub', Object.assign({ action }, payload || {}));
  } catch (e) {
    return { ok: false, code: 'EVENT_HUB_FAILED', message: String(e) };
  }
}

async function getEventProfile(eventId) {
  const id = cleanString(eventId, 120);
  if (!id) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  if (cloudReady()) {
    const res = await eventHub('getEventProfile', { eventId: id });
    if (res && res.ok) {
      if (res.eventProfile) {
        const profiles = upsertByEventId(getLocalEventProfiles(), id, res.eventProfile);
        setLocalEventProfiles(profiles.list);
      }
      if (Array.isArray(res.achievements)) setLocalAchievements(res.achievements);
      return res;
    }
  }
  const event = await getEventSummary(id);
  const checkin = getEventCheckins().find((item) => item.eventId === id) || null;
  const eventProfile = getLocalEventProfiles().find((item) => item.eventId === id) || null;
  return {
    ok: true,
    local: true,
    event,
    checkedIn: !!checkin,
    checkin,
    eventProfile,
    achievements: getLocalAchievements(),
  };
}

async function checkinEvent(eventId, profilePatch) {
  const id = cleanString(eventId, 120);
  if (!id) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const eventProfile = normalizeEventProfile(profilePatch);
  if (cloudReady()) {
    const res = await eventHub('checkin', { eventId: id, profile: eventProfile });
    if (res && res.ok) {
      const checkins = upsertByEventId(getEventCheckins(), id, res.checkin || { eventId: id, checkedInAt: Date.now() });
      setEventCheckins(checkins.list);
      if (res.eventProfile) {
        const profiles = upsertByEventId(getLocalEventProfiles(), id, res.eventProfile);
        setLocalEventProfiles(profiles.list);
      }
      return res;
    }
    return res;
  }
  const event = await getEventSummary(id);
  const now = Date.now();
  const checkins = upsertByEventId(getEventCheckins(), id, { checkedInAt: now, updatedAt: now });
  setEventCheckins(checkins.list);
  const profiles = upsertByEventId(getLocalEventProfiles(), id, Object.assign({}, eventProfile, {
    uid: getProfile().publicId || 'local-user',
    eventId: id,
    checkedInAt: now,
    updatedAt: now,
  }));
  setLocalEventProfiles(profiles.list);
  return { ok: true, local: true, event, checkin: checkins.item, eventProfile: profiles.item };
}

async function saveEventProfile(eventId, profilePatch) {
  const id = cleanString(eventId, 120);
  if (!id) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const eventProfile = normalizeEventProfile(profilePatch);
  if (cloudReady()) {
    const res = await eventHub('saveEventProfile', { eventId: id, profile: eventProfile });
    if (res && res.ok && res.eventProfile) {
      const profiles = upsertByEventId(getLocalEventProfiles(), id, res.eventProfile);
      setLocalEventProfiles(profiles.list);
    }
    return res;
  }
  const profiles = upsertByEventId(getLocalEventProfiles(), id, Object.assign({}, eventProfile, {
    uid: getProfile().publicId || 'local-user',
    updatedAt: Date.now(),
  }));
  setLocalEventProfiles(profiles.list);
  return { ok: true, local: true, eventProfile: profiles.item };
}

async function listEventMembers(eventId) {
  const id = cleanString(eventId, 120);
  if (!id) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID', members: [] };
  if (cloudReady()) {
    const res = await eventHub('listEventMembers', { eventId: id });
    if (res && res.ok) {
      setStorage(STORAGE.EVENT_MEMBERS, res.members || []);
      return res;
    }
  }
  const members = getStorage(STORAGE.EVENT_MEMBERS, []);
  return { ok: true, local: true, event: await getEventSummary(id), members: Array.isArray(members) ? members.filter((item) => item.eventId === id) : [] };
}

function localHandshakeReport(me, target) {
  const same = cleanStringList(me.skills, 20, 40).filter((skill) => cleanStringList(target.skills, 20, 40).map((x) => x.toLowerCase()).indexOf(skill.toLowerCase()) !== -1);
  const targetUnique = cleanStringList(target.skills, 20, 40).filter((skill) => cleanStringList(me.skills, 20, 40).map((x) => x.toLowerCase()).indexOf(skill.toLowerCase()) === -1);
  const score = Math.min(96, 58 + same.length * 8 + targetUnique.length * 5);
  return {
    score,
    summary: `${score}% 适合认识。先聊共同技术，再看项目目标和角色互补。`,
    common: same.length ? [`你们都提到了 ${same.slice(0, 4).join('、')}，适合从技术选择聊起。`] : ['公开资料重叠不多，适合用项目目标快速破冰。'],
    complement: targetUnique.length ? [`对方有 ${targetUnique.slice(0, 4).join('、')}，可以补齐你的能力半径。`] : ['你们能力结构接近，适合一起推进原型或互相 review。'],
    topics: [target.projectIdea ? `你这个「${target.projectIdea}」现在最缺哪块？` : '这场比赛你最想验证哪个想法？'],
    opener: `嗨，我是 ${me.displayName || 'HackerTrip 用户'}。HackerTrip 说我们有 ${score}% 的合作契合度，想听听你这次最想做的方向。`,
  };
}

async function createHandshake(eventId, targetUid) {
  const id = cleanString(eventId, 120);
  const uid = cleanString(targetUid, 80);
  if (!id || !uid) return { ok: false, code: 'BAD_REQUEST', message: '缺少活动或目标用户' };
  if (cloudReady()) return eventHub('createHandshake', { eventId: id, targetUid: uid });
  const me = getLocalEventProfiles().find((item) => item.eventId === id) || normalizeEventProfile({});
  const target = (getStorage(STORAGE.EVENT_MEMBERS, []) || []).find((item) => item.uid === uid) || null;
  if (!target) return { ok: false, code: 'NO_TARGET', message: '本地暂无目标成员数据' };
  return { ok: true, local: true, me, target, report: localHandshakeReport(me, target) };
}

function scoreMemberForTeam(member, goal, missingRoles, mySkills) {
  const text = [
    member.displayName,
    member.role,
    member.projectIdea,
    member.availability,
    ...(member.skills || []),
    ...(member.lookingFor || []),
  ].join(' ').toLowerCase();
  const goalTokens = cleanStringList(goal, 12, 40);
  const roleTokens = cleanStringList(missingRoles, 8, 40);
  const mySkillTokens = cleanStringList(mySkills, 20, 40).map((item) => item.toLowerCase());
  const hits = [];
  let score = 46;

  roleTokens.forEach((token) => {
    if (text.indexOf(token.toLowerCase()) !== -1) {
      score += 16;
      hits.push(`匹配缺口「${token}」`);
    }
  });
  goalTokens.forEach((token) => {
    if (text.indexOf(token.toLowerCase()) !== -1) {
      score += 8;
      hits.push(`方向相关「${token}」`);
    }
  });
  const uniqueSkills = cleanStringList(member.skills, 20, 40)
    .filter((skill) => mySkillTokens.indexOf(skill.toLowerCase()) === -1)
    .slice(0, 4);
  if (uniqueSkills.length) {
    score += Math.min(20, uniqueSkills.length * 5);
    hits.push(`补充 ${uniqueSkills.join('、')}`);
  }
  if (member.availability) {
    score += 4;
    hits.push(`已填写投入时间`);
  }

  return Object.assign({}, member, {
    teamScore: Math.min(96, score),
    teamReasons: hits.slice(0, 4),
    teamReasonText: hits.length ? hits.slice(0, 4).join('；') : '资料较少，建议先用 AI 破冰确认目标和时间。',
  });
}

async function recommendTeamMembers(eventId, goal, missingRoles) {
  const membersRes = await listEventMembers(eventId);
  const members = membersRes && Array.isArray(membersRes.members) ? membersRes.members : [];
  const profile = getProfile();
  const pref = profile.teamPreference || {};
  const projectGoal = cleanString(goal || pref.projectIdea, 240);
  const roles = cleanStringList(missingRoles && cleanStringList(missingRoles).length ? missingRoles : pref.lookingFor, 8, 40);
  const scored = members
    .map((member) => scoreMemberForTeam(member, projectGoal, roles, profile.skills || []))
    .sort((a, b) => b.teamScore - a.teamScore)
    .slice(0, 8);
  const advice = [];
  if (!projectGoal) advice.push('先把项目目标写成一句话，推荐会更准。');
  if (!roles.length) advice.push('请明确缺少的角色，例如后端、设计、硬件、路演或增长。');
  if (!members.length) advice.push('当前活动还没有开放发现的成员，先邀请大家完成签到和活动身份。');
  if (scored.length) advice.push('优先联系分数高且理由具体的人，再用 AI 破冰确认时间和目标。');
  if (!advice.length) advice.push('推荐结果可用，建议先聊项目目标、角色边界和可投入时间。');
  return { ok: true, event: membersRes.event || null, goal: projectGoal, missingRoles: roles, members: scored, advice };
}

async function listAchievements(uid) {
  if (cloudReady()) {
    const res = await eventHub('listAchievements', uid ? { uid } : {});
    if (res && res.ok && Array.isArray(res.achievements)) {
      if (!uid) setLocalAchievements(res.achievements);
      return res;
    }
  }
  return { ok: true, local: true, achievements: getLocalAchievements() };
}

async function verifyAchievement(payload) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能验证履历' };
  }
  const res = await eventHub('verifyAchievement', payload || {});
  return res || { ok: false, code: 'EMPTY_RESPONSE', message: '验证失败' };
}

function textFromNamedList(list, key) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item[key] || item.name || item.title || item.summary || '';
      return '';
    })
    .map((item) => cleanString(item, 200))
    .filter((item) => item);
}

function generateRegistrationDraft(formText) {
  const profile = getProfile();
  const pref = profile.teamPreference && typeof profile.teamPreference === 'object' ? profile.teamPreference : {};
  const skills = cleanStringList(profile.skills, 20, 40);
  const projects = textFromNamedList(profile.projects, 'name');
  const experiences = textFromNamedList(profile.experiences, 'title');
  const awards = textFromNamedList(profile.awards, 'title');
  const verified = getLocalAchievements().filter((item) => item && item.verified);
  const missing = [];

  if (!profile.nickname) missing.push('昵称/姓名');
  if (!profile.role) missing.push('当前角色');
  if (!profile.bio) missing.push('个人简介');
  if (!skills.length) missing.push('技能栈');
  if (!projects.length) missing.push('项目经历');
  if (!experiences.length) missing.push('过往经历');
  if (!pref.projectIdea) missing.push('本次参赛方向');

  const sections = [
    {
      title: '基础介绍',
      content: [
        profile.nickname ? `我是 ${profile.nickname}` : '我是（请补充姓名/昵称）',
        profile.role ? `，当前身份是 ${profile.role}` : '',
        profile.city ? `，常驻 ${profile.city}` : '',
        profile.bio ? `。${profile.bio}` : '。这里建议补充 1-2 句和本赛事相关的背景。',
      ].join(''),
    },
    {
      title: '技能栈',
      content: skills.length ? skills.join('、') : '请补充你能实际交付的技术、设计、产品或增长能力。',
    },
    {
      title: '项目经历',
      content: projects.length ? projects.map((item, index) => `${index + 1}. ${item}`).join('\n') : '请补充 1-3 个最能证明交付能力的项目。',
    },
    {
      title: '过往经历',
      content: experiences.length ? experiences.map((item, index) => `${index + 1}. ${item}`).join('\n') : '请补充参赛、实习、产品、开源、社区或创业经历。',
    },
    {
      title: '获奖/可信记录',
      content: verified.length
        ? verified.map((item, index) => `${index + 1}. ${item.eventName || item.eventId} - ${item.title}（主办方已验证）`).join('\n')
        : (awards.length ? awards.map((item, index) => `${index + 1}. ${item}（自填，建议后续找主办方验证）`).join('\n') : '暂无记录。获奖经历建议只写可核验内容。'),
    },
    {
      title: '本次参赛方向',
      content: pref.projectIdea || '请结合本次赛事主题，写一个具体、可在 24-48 小时内做出 Demo 的方向。',
    },
    {
      title: '组队需求',
      content: cleanStringList(pref.lookingFor, 8, 40).length
        ? `希望寻找：${cleanStringList(pref.lookingFor, 8, 40).join('、')}。${pref.availability ? `可投入时间：${pref.availability}。` : ''}`
        : '请补充你缺少的角色，例如后端、设计、硬件、商业化、路演。',
    },
  ];

  const source = cleanString(formText, 2000);
  const advice = [];
  if (source) advice.push('已根据你粘贴的报名表内容生成通用草稿；主观题需要结合赛事主题再人工改写。');
  if (missing.length) advice.push(`资料库缺少：${missing.join('、')}。建议先补齐后再提交报名。`);
  if (!verified.length && awards.length) advice.push('当前获奖记录是自填数据，展示可信履历时应使用主办方验证记录。');
  if (!advice.length) advice.push('资料库较完整，可以直接复制草稿后针对赛事主题微调。');

  return { ok: true, sections, missing, advice };
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

async function createEventSubmitPair() {
  if (!isOrganizerApproved()) {
    return { ok: false, code: 'NOT_ORGANIZER', message: '需先通过组织者认证' };
  }
  return createSyncPair();
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

/* ----------------------------- 订阅消息 ----------------------------- */

function getSubscribeTemplates() {
  const cfg = (ENV && ENV.subscribeTemplates) || {};
  return {
    [SUBSCRIBE_TYPES.NEW_HACKATHON]: cfg.newHackathon || '',
    [SUBSCRIBE_TYPES.SMART_RECOMMENDATION]: cfg.smartRecommendation || '',
    [SUBSCRIBE_TYPES.DEADLINE_REMINDER]: cfg.deadlineReminder || '',
  };
}

function getSubscriptionCache() {
  const cached = getStorage(STORAGE.SUBSCRIPTIONS, []);
  return Array.isArray(cached) ? cached : [];
}

function setSubscriptionCache(records) {
  const incoming = Array.isArray(records) ? records : [];
  const map = {};
  getSubscriptionCache().forEach((item) => {
    const key = item && item.type ? item.type : '';
    if (key) map[key] = item;
  });
  incoming.forEach((item) => {
    const key = item && item.type ? item.type : '';
    if (key) map[key] = Object.assign({}, map[key] || {}, item);
  });
  const next = Object.keys(map).map((key) => map[key]);
  setStorage(STORAGE.SUBSCRIPTIONS, next);
  return next;
}

function requestSubscribeMessage(tmplIds) {
  return new Promise((resolve) => {
    if (!wx.requestSubscribeMessage) {
      resolve({ errMsg: 'requestSubscribeMessage:fail unsupported' });
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds,
      success: resolve,
      fail: resolve,
    });
  });
}

async function requestMessageSubscriptions(types, source, preferences) {
  if (!isLoggedIn()) {
    return { ok: false, code: 'LOGIN_REQUIRED', message: '登录后才能订阅消息提醒' };
  }

  const uniqueTypes = Array.from(new Set((Array.isArray(types) ? types : [types]).filter(Boolean)));
  const templates = getSubscribeTemplates();
  const missingTypes = uniqueTypes.filter((type) => !templates[type]);
  if (!uniqueTypes.length || missingTypes.length) {
    return {
      ok: false,
      code: 'TEMPLATE_NOT_CONFIGURED',
      message: '订阅消息模板 ID 还没有配置',
      missingTypes,
    };
  }

  const templateMap = {};
  const tmplIds = uniqueTypes.map((type) => {
    templateMap[templates[type]] = type;
    return templates[type];
  });
  const result = await requestSubscribeMessage(tmplIds);
  const now = Date.now();
  const records = tmplIds.map((templateId) => {
    const type = templateMap[templateId];
    return {
      type,
      label: SUBSCRIBE_TYPE_LABELS[type] || type,
      templateId,
      status: result[templateId] || 'unknown',
      source: source || 'unknown',
      updatedAt: now,
    };
  });
  setSubscriptionCache(records);

  if (cloudReady()) {
    callFn('saveSubscription', {
      source: source || 'unknown',
      preferences: preferences || {},
      records,
    }).catch((e) => {
      console.warn('[api] 订阅状态云端同步失败', e);
    });
  }

  const acceptedTypes = records.filter((item) => item.status === 'accept').map((item) => item.type);
  const rejectedTypes = records.filter((item) => item.status !== 'accept').map((item) => item.type);
  return { ok: true, records, acceptedTypes, rejectedTypes, raw: result };
}

async function sendHackathonNotifications(payload) {
  if (!cloudReady()) {
    return { ok: false, code: 'CLOUD_REQUIRED', message: '需要连接云开发后才能发送通知' };
  }
  try {
    const res = await callFn('sendHackathonNotifications', payload || {});
    return res || { ok: false, code: 'EMPTY_RESPONSE', message: '通知发送失败' };
  } catch (e) {
    return { ok: false, code: 'NOTIFICATION_SEND_FAILED', message: String(e) };
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
      if (Array.isArray(res.bookmarkIds)) setStorage(STORAGE.BOOKMARKS, mergeIds(res.bookmarkIds, getBookmarks()));
      if (Array.isArray(res.registrations)) {
        setStorage(STORAGE.REGISTRATIONS, mergeById(res.registrations, getRegistrations()));
      }
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
  SUBSCRIBE_TYPES,
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
  getLocalHackathonHeat,
  getRecommendedHackathons,
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
  getEventCheckins,
  getEventProfile,
  checkinEvent,
  saveEventProfile,
  listEventMembers,
  createHandshake,
  recommendTeamMembers,
  listAchievements,
  verifyAchievement,
  generateRegistrationDraft,
  listReviewWorks,
  updateReviewWork,
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
  createEventSubmitPair,
  pullSyncByCode,
  getSubscribeTemplates,
  getSubscriptionCache,
  requestMessageSubscriptions,
  sendHackathonNotifications,
  aiChat,
  getGrowth,
  setGrowth,
  getInviteCode,
  redeemInvite,
};
