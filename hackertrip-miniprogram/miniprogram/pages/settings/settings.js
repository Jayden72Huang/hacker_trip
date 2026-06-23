const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '设置',
    aiBanner: false,
    aiIntentText: 'settings',
    noticeOn: true,
    loggedIn: false,
    account: { name: '未登录', login: '点击「微信登录」开始', sync: '' },
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

  refresh() {
    const app = getApp();
    const auth = app.globalData.auth;
    const profile = api.getProfile();
    if (auth && auth.userInfo) {
      this.setData({
        loggedIn: true,
        account: {
          name: profile.nickname || auth.userInfo.nickName || '微信用户',
          login: '微信已登录',
          sync: 'Skills 最近同步：今天',
        },
      });
    } else {
      this.setData({
        loggedIn: false,
        account: { name: '未登录', login: '点击「微信登录」开始', sync: '' },
      });
    }
  },

  onNoticeChange(e) {
    this.setData({ noticeOn: e.detail.value });
  },

  goLogin() {
    if (this.data.loggedIn) return;
    wx.navigateTo({ url: '/pages/login/login' });
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
    const app = getApp();
    app.globalData.auth = null;
    try { wx.removeStorageSync('ht_auth'); } catch (e) {}
    wx.showToast({ title: '已退出登录', icon: 'none' });
    this.refresh();
  },
});
