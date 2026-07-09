const api = require('../../utils/api.js');

Component({
  data: {
    visible: false,
    logging: false,
    reason: '登录后可以同步身份信息、赛程和身份卡。',
    nickName: '',
    avatarUrl: '',
  },

  methods: {
    noop() {},

    open(options) {
      if (api.isLoggedIn()) return Promise.resolve(api.getAuth());
      this.pendingResolve = null;
      this._profilePrompted = false;
      this.setData({
        visible: true,
        logging: false,
        nickName: '',
        avatarUrl: '',
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

    onChooseAvatar(e) {
      const url = e && e.detail && e.detail.avatarUrl;
      if (url) this.setData({ avatarUrl: url });
    },

    onNicknameInput(e) {
      this.setData({ nickName: (e.detail && e.detail.value) || '' });
    },

    async onLoginTap() {
      if (this.data.logging) return;
      // 头像昵称都没填时提醒一次（微信平台不支持登录静默获取，只能引导用户点选）
      if (!this.data.nickName.trim() && !this.data.avatarUrl && !this._profilePrompted) {
        this._profilePrompted = true;
        const wantsProfile = await new Promise((resolve) => {
          wx.showModal({
            title: '用微信头像和昵称登录？',
            content: '点上方「选头像」可直接用微信头像，昵称框可一键填入微信昵称。也可以先匿名登录，之后在「我的」里补全。',
            confirmText: '去设置',
            cancelText: '匿名登录',
            success: (res) => resolve(!!res.confirm),
            fail: () => resolve(false),
          });
        });
        if (wantsProfile) return;
      }
      this.setData({ logging: true });
      try {
        const auth = await api.loginWithUserInfo({
          nickName: this.data.nickName.trim(),
          avatarUrl: this.data.avatarUrl,
        });
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
  },
});
