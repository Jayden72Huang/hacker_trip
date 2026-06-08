const DEFAULT_AVATAR = '';

Page({
  data: {
    statusBarH: 20,
    avatarUrl: '',
    nickname: '',
    agreed: false,
    phone: '',
  },

  onLoad() {
    let sb = 20;
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      sb = win.statusBarHeight || 20;
    } catch (e) {}
    let avatarUrl = '';
    let nickname = '';
    try {
      avatarUrl = wx.getStorageSync('ht_user_avatar') || '';
      nickname = wx.getStorageSync('ht_user_name') || '';
      if (nickname === '黑客松选手') nickname = '';
    } catch (e) {}
    this.setData({ statusBarH: sb, avatarUrl, nickname });
  },

  // 头像选择（微信头像昵称填写能力）
  onChooseAvatar(e) {
    const url = e.detail && e.detail.avatarUrl;
    if (url) this.setData({ avatarUrl: url });
  },
  onNickInput(e) {
    this.setData({ nickname: e.detail.value });
  },
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  // 手机号快捷登录（需企业认证；返回加密 code，交云函数解密绑定）
  onGetPhone(e) {
    if (!this.ensureAgree()) return;
    const d = e.detail;
    if (d && d.code) {
      // 真机：把 d.code 交云函数换取手机号；此处先记录登录态
      this.finish({ phone: '已绑定' });
    } else {
      wx.showToast({ title: '已取消', icon: 'none' });
    }
  },

  ensureAgree() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意隐私协议', icon: 'none' });
      return false;
    }
    return true;
  },

  // 仅用头像昵称完成（不绑手机号）
  finishProfile() {
    if (!this.ensureAgree()) return;
    const name = (this.data.nickname || '').trim();
    if (!name) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    this.finish({});
  },

  finish(extra) {
    try {
      if (this.data.nickname) wx.setStorageSync('ht_user_name', this.data.nickname.trim());
      if (this.data.avatarUrl) wx.setStorageSync('ht_user_avatar', this.data.avatarUrl);
      if (extra && extra.phone) wx.setStorageSync('ht_user_phone', extra.phone);
    } catch (e) {}
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) wx.navigateBack();
      else wx.reLaunch({ url: '/pages/index/index' });
    }, 600);
  },

  skip() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/index/index' });
  },

  openPrivacy() {
    wx.showModal({
      title: '用户隐私保护指引',
      content: '我们仅收集你的微信头像、昵称（用于生成身份卡）及手机号（用于账号绑定）。代码扫描 100% 本地运行不上传。详见 hackertrip.space 公示。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
