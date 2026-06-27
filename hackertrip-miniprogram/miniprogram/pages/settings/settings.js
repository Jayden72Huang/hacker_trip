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
    account: { name: '未登录', login: '请到「我的」页完成微信登录', sync: '' },
    rows: [
      { label: '隐私设置', value: '公开主页展示昵称、城市、技能和作品摘要' },
      { label: '缓存管理', value: '本地缓存赛事、收藏、身份卡和同步结果' },
    ],
  },

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
        account: { name: '未登录', login: '请到「我的」页完成微信登录', sync: '' },
      });
    }
  },

  goProfileLogin() {
    if (this.data.loggedIn) return;
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  ensureLoggedInForSubscribe() {
    if (api.isLoggedIn()) return Promise.resolve(true);
    return new Promise((resolve) => {
      wx.showModal({
        title: '需要微信登录',
        content: '登录后才能订阅黑客松提醒。',
        confirmText: '去我的页',
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: '/pages/profile/profile' });
          resolve(false);
        },
        fail: () => resolve(false),
      });
    });
  },

  async subscribeByType(type, source) {
    const loggedIn = await this.ensureLoggedInForSubscribe();
    if (!loggedIn) return;
    const res = await api.requestMessageSubscriptions([type], source || 'settings');
    if (!res.ok) {
      wx.showModal({
        title: '订阅暂不可用',
        content: res.code === 'TEMPLATE_NOT_CONFIGURED'
          ? '还没有配置微信订阅消息模板 ID。请先在微信公众平台添加模板，再填入 miniprogram/env.js。'
          : (res.message || '请稍后再试'),
        showCancel: false,
      });
      return;
    }
    const accepted = res.acceptedTypes && res.acceptedTypes.length;
    wx.showToast({ title: accepted ? '已开启提醒' : '未授权提醒', icon: 'none' });
  },

  subscribeNewHackathons() {
    return this.subscribeByType(api.SUBSCRIBE_TYPES.NEW_HACKATHON, 'settings_new_hackathon');
  },

  subscribeSmartRecommendation() {
    return this.subscribeByType(api.SUBSCRIBE_TYPES.SMART_RECOMMENDATION, 'settings_smart_recommendation');
  },

  subscribeDeadlineReminder() {
    return this.subscribeByType(api.SUBSCRIBE_TYPES.DEADLINE_REMINDER, 'settings_deadline_reminder');
  },

  onRowTap(e) {
    const label = e.currentTarget.dataset.label;
    if (label === '缓存管理') {
      this.clearCache();
    } else if (label === '隐私设置') {
      wx.showToast({ title: '公开主页可在「我的→公开主页」预览', icon: 'none' });
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
    wx.showToast({ title: '已退出登录', icon: 'none' });
    this.refresh();
  },
});
