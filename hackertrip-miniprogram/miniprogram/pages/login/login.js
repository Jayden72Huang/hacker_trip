const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '登录',
    aiBanner: false,
    aiIntentText: 'login',
    redirect: '', // 写操作来源页，登录后回原任务
    logging: false,
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'login',
      redirect: options.redirect ? decodeURIComponent(options.redirect) : '',
    });
  },

  // 必须在用户点击手势里直接调 getUserProfile（微信合规要求）
  onLogin() {
    if (this.data.logging) return;
    wx.getUserProfile({
      desc: '用于完善你的参赛身份卡和公开主页',
      success: (res) => {
        this.setData({ logging: true });
        this.finishLogin(res.userInfo);
      },
      fail: () => {
        wx.showToast({ title: '已取消登录', icon: 'none' });
      },
    });
  },

  finishLogin(userInfo) {
    const app = getApp();
    const persist = (openid) => {
      const auth = { openid: openid || null, userInfo, loginAt: Date.now() };
      app.globalData.auth = auth;
      try { wx.setStorageSync('ht_auth', auth); } catch (e) {}
      // 昵称/头像同步进统一用户档案，身份卡/公开主页/我的页立即生效
      api.saveProfile({ nickname: userInfo.nickName, avatarUrl: userInfo.avatarUrl });
      wx.showToast({ title: '登录成功', icon: 'success' });
      // 登录后从云端拉取收藏/报名/卡片合并到本地，完成后回原任务（失败也回）
      Promise.resolve(api.syncFromCloud()).catch(() => {}).then(() => setTimeout(() => this.goBack(), 400));
    };

    if (app.globalData.cloudReady && wx.cloud) {
      wx.cloud.callFunction({
        name: 'login',
        data: { userInfo },
        success: (r) => persist(r.result && r.result.openid),
        fail: () => persist(null), // 云端失败降级本地登录态，不阻断
      });
    } else {
      persist(null);
    }
  },

  goBack() {
    const redirect = this.data.redirect;
    if (redirect) {
      const TAB_PAGES = ['/pages/index/index', '/pages/schedule/schedule', '/pages/inbox/inbox', '/pages/profile/profile'];
      if (TAB_PAGES.some((p) => redirect.indexOf(p) === 0)) {
        wx.switchTab({ url: redirect });
      } else {
        wx.redirectTo({ url: redirect });
      }
      return;
    }
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/profile/profile' });
  },
});
