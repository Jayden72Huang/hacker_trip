const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '登录',
    aiBanner: false,
    aiIntentText: 'login',
    redirect: '', // 写操作来源页，登录后回原任务
    logging: false,
    nickName: '',
    avatarUrl: '',
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'login',
      redirect: options.redirect ? decodeURIComponent(options.redirect) : '',
    });
  },

  onChooseAvatar(e) {
    const url = e && e.detail && e.detail.avatarUrl;
    if (url) this.setData({ avatarUrl: url });
  },

  onNicknameInput(e) {
    this.setData({ nickName: (e.detail && e.detail.value) || '' });
  },

  onLogin() {
    if (this.data.logging) return;
    this.setData({ logging: true });
    this.finishLogin({
      nickName: this.data.nickName.trim(),
      avatarUrl: this.data.avatarUrl,
    });
  },

  finishLogin(userInfo) {
    api.loginWithUserInfo(userInfo)
      .then(() => {
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => this.goBack(), 400);
      })
      .catch(() => {
        this.setData({ logging: false });
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      });
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
