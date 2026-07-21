const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

function formatSyncTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page({
  data: {
    title: '设置',
    aiBanner: false,
    aiIntentText: 'settings',
    loggedIn: false,
    account: { name: '未登录', login: '到「我的」页点头像或昵称即可登录', sync: '' },
    notify: [
      { type: 'new_hackathon', label: '上新提醒', desc: '有新黑客松上线时通知你', on: false },
      { type: 'smart_recommendation', label: '智能推荐', desc: '按你的技能推荐合适赛事', on: false },
      { type: 'deadline_reminder', label: '截止提醒', desc: '报名 / 提交截止前提醒你', on: false },
    ],
    privacy: [
      { key: 'publicSite', label: '公开主页', desc: '允许他人通过链接查看你的主页', on: true },
      { key: 'skills', label: '公开技能', desc: '在公开主页展示技能标签', on: true },
      { key: 'works', label: '公开作品', desc: '在公开主页展示作品与项目', on: true },
    ],
    rows: [
      { label: '缓存管理', value: '本地缓存赛事、收藏、身份卡和同步结果' },
    ],
  },

  NOTIFY_PREF_KEY: 'ht_notify_prefs',

  onShow() {
    this.refresh();
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({ aiBanner: ai.fromAI, aiIntentText: ai.intent || 'settings' });
    this.refresh();
  },

  async refresh() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const auth = api.getAuth();
    const profile = api.getProfile();
    const scan = api.getScanResults();
    const syncTime = scan && scan.syncedAt ? formatSyncTime(scan.syncedAt) : '';
    if (auth && auth.userInfo) {
      this.setData({
        loggedIn: true,
        account: {
          name: profile.nickname || auth.userInfo.nickName || '微信用户',
          login: '微信已登录',
          sync: syncTime ? `Skills 最近同步：${syncTime}` : 'Skills 尚未同步',
        },
      });
    } else {
      this.setData({
        loggedIn: false,
        account: { name: '未登录', login: '到「我的」页点头像或昵称即可登录', sync: '' },
      });
    }
    this.syncToggleStates();
  },

  // 用订阅缓存 + 本地偏好初始化通知开关，用 profile.visibility 初始化隐私开关
  syncToggleStates() {
    const prefs = this.getNotifyPrefs();
    const accepted = {};
    (api.getSubscriptionCache() || []).forEach((s) => {
      if (s && s.type) accepted[s.type] = s.status === 'accept';
    });
    const notify = this.data.notify.map((n) => ({
      ...n,
      on: Object.prototype.hasOwnProperty.call(prefs, n.type) ? !!prefs[n.type] : !!accepted[n.type],
    }));
    const vis = api.getProfileVisibility();
    const privacy = this.data.privacy.map((p) => ({ ...p, on: vis[p.key] !== false }));
    this.setData({ notify, privacy });
  },

  getNotifyPrefs() {
    try {
      const p = wx.getStorageSync(this.NOTIFY_PREF_KEY);
      return p && typeof p === 'object' ? p : {};
    } catch (e) {
      return {};
    }
  },

  setNotifyPref(type, on) {
    const prefs = this.getNotifyPrefs();
    prefs[type] = on;
    try { wx.setStorageSync(this.NOTIFY_PREF_KEY, prefs); } catch (e) {}
  },

  updateNotifyUI(type, on) {
    this.setData({ notify: this.data.notify.map((n) => (n.type === type ? { ...n, on } : n)) });
  },

  goProfileLogin() {
    if (this.data.loggedIn) return;
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  // 通知开关：打开→在 tap 手势链内唤起订阅授权；关闭→本地记录不再推送
  onNotifyToggle(e) {
    const type = e.currentTarget.dataset.type;
    const on = e.detail.value;
    if (!on) {
      this.setNotifyPref(type, false);
      this.updateNotifyUI(type, false);
      wx.showToast({ title: '已关闭该提醒', icon: 'none' });
      return;
    }
    // 必须同步进入 requestMessageSubscriptions 才能保住手势，之后再 await 结果
    const subscribePromise = api.requestMessageSubscriptions([type], `settings_${type}`);
    this.handleNotifyResult(type, subscribePromise);
  },

  async handleNotifyResult(type, subscribePromise) {
    const res = await subscribePromise;
    if (!res.ok) {
      this.updateNotifyUI(type, false);
      let title = '订阅暂不可用';
      if (res.code === 'TEMPLATE_NOT_CONFIGURED') title = '未配置订阅模板';
      else if (res.code === 'SUBSCRIBE_FAILED') title = `唤起失败(${res.errCode || '未知'})`;
      wx.showToast({ title, icon: 'none' });
      return;
    }
    const accepted = res.acceptedTypes && res.acceptedTypes.indexOf(type) >= 0;
    this.setNotifyPref(type, accepted);
    this.updateNotifyUI(type, accepted);
    wx.showToast({ title: accepted ? '已开启提醒' : '未授权', icon: accepted ? 'success' : 'none' });
  },

  // 隐私开关：更新 profile.visibility 并同步云端，控制公开主页对外展示
  onPrivacyToggle(e) {
    const key = e.currentTarget.dataset.key;
    const on = e.detail.value;
    const privacy = this.data.privacy.map((p) => (p.key === key ? { ...p, on } : p));
    this.setData({ privacy });
    const visibility = {};
    privacy.forEach((p) => { visibility[p.key] = p.on; });
    api.saveProfile({ visibility });
    wx.showToast({ title: on ? '已公开' : '已隐藏', icon: 'none' });
  },

  onRowTap(e) {
    const label = e.currentTarget.dataset.label;
    if (label === '缓存管理') {
      this.clearCache();
    }
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存的赛事、收藏、身份卡和同步结果（不影响云端数据）。',
      confirmText: '清除',
      success: (r) => {
        if (!r.confirm) return;
        ['ht_bookmarks', 'ht_registrations', 'ht_cards', 'ht_scan_results'].forEach((k) => {
          try { wx.removeStorageSync(k); } catch (e) {}
        });
        wx.showToast({ title: '已清除缓存', icon: 'success' });
      },
    });
  },

  logout() {
    api.clearUserSession();
    // 标记主动退出：阻止「我的」页自动静默重登，用户改头像/昵称等主动操作时才解除
    try { wx.setStorageSync('ht_logged_out', true); } catch (e) {}
    wx.showToast({ title: '已退出登录', icon: 'none' });
    this.refresh();
  },
});
