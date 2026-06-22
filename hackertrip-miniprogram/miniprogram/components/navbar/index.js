Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    showBack: {
      type: Boolean,
      value: true,
    },
    showHome: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    statusBarHeight: 0,
    navHeight: 44,
    rightReserved: 101,
  },

  lifetimes: {
    attached() {
      this.setMetrics();
    },
  },

  methods: {
    setMetrics() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const rightReserved = menu && info.windowWidth
        ? Math.max(94, info.windowWidth - menu.left + 7)
        : 101;

      this.setData({
        statusBarHeight: info.statusBarHeight || 0,
        rightReserved,
      });
    },

    goBack() {
      const pages = getCurrentPages();

      if (pages.length > 1) {
        wx.navigateBack();
        return;
      }

      wx.switchTab({
        url: '/pages/index/index',
      });
    },

    goHome() {
      wx.switchTab({
        url: '/pages/index/index',
      });
    },
  },
});
