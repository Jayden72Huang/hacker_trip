const AUTO_ENTER_DELAY = 3000;

Page({
  data: {
    heroTopPadding: 72,
  },

  onLoad() {
    this.setHeroMetrics();
  },

  onShow() {
    this.startAutoEnter();
  },

  onHide() {
    this.clearAutoEnter();
  },

  onUnload() {
    this.clearAutoEnter();
  },

  setHeroMetrics() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      heroTopPadding: (info.statusBarHeight || 0) + 28,
    });
  },

  startAutoEnter() {
    this.clearAutoEnter();
    this._autoEnterTimer = setTimeout(() => {
      this.goDiscover();
    }, AUTO_ENTER_DELAY);
  },

  clearAutoEnter() {
    if (!this._autoEnterTimer) return;
    clearTimeout(this._autoEnterTimer);
    this._autoEnterTimer = null;
  },

  goDiscover() {
    this.clearAutoEnter();
    wx.switchTab({ url: '/pages/discover/discover' });
  },

  goJoinHackathon() {
    this.goDiscover();
  },

  goHostHackathon() {
    this.clearAutoEnter();
    wx.navigateTo({
      url: '/pages/organizer/organizer?from=cover&redirect=discover',
    });
  },
});
