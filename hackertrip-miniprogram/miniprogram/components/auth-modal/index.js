const api = require('../../utils/api.js');

Component({
  data: {
    visible: false,
    logging: false,
    reason: '登录后可以同步身份信息、赛程和身份卡。',
  },

  methods: {
    noop() {},

    open(options) {
      if (api.isLoggedIn()) return Promise.resolve(api.getAuth());
      this.pendingResolve = null;
      this.setData({
        visible: true,
        logging: false,
        reason: (options && options.reason) || '登录后可以同步身份信息、赛程和身份卡。',
      });
      return new Promise((resolve) => {
        this.pendingResolve = resolve;
      });
    },

    close(options) {
      this.setData({ visible: false, logging: false });
      if (this.pendingResolve) this.pendingResolve(null);
      this.pendingResolve = null;
      if (!(options && options.silent)) {
        wx.showToast({ title: '未完成登录', icon: 'none' });
      }
    },

    onLoginTap() {
      if (this.data.logging) return;
      wx.getUserProfile({
        desc: '用于同步你的身份卡、赛程和公开主页',
        success: async (res) => {
          this.setData({ logging: true });
          try {
            const auth = await api.loginWithUserInfo(res.userInfo);
            this.setData({ visible: false, logging: false });
            this.triggerEvent('login', auth);
            if (this.pendingResolve) this.pendingResolve(auth);
            this.pendingResolve = null;
            wx.showToast({ title: '登录成功', icon: 'success' });
          } catch (e) {
            this.setData({ logging: false });
            wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          }
        },
        fail: () => {
          this.close({ silent: true });
        },
      });
    },
  },
});
