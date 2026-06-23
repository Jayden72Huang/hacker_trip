const env = require('./env.js');

App({
  globalData: {
    /** 是否成功初始化云开发（决定 api.js 走云端还是本地 mock） */
    cloudReady: false,
    envId: env.envId,
    /** 当前用户的本地身份卡草稿（localStorage 同源思路，存 storage） */
    systemInfo: null,
    /** 同步配对码（与 CLI/网页端打通 Skills 同步） */
    pairCode: '',
    /** 登录态：{ openid, userInfo, loginAt }，未登录为 null */
    auth: null,
  },

  onLaunch() {
    // 1. 系统信息（用于 canvas 适配、安全区）
    try {
      this.globalData.systemInfo = wx.getWindowInfo
        ? wx.getWindowInfo()
        : wx.getSystemInfoSync();
    } catch (e) {
      this.globalData.systemInfo = null;
    }

    // 2. 云开发初始化（best-effort，失败静默降级到 mock）
    if (wx.cloud && env.envId) {
      try {
        wx.cloud.init({
          env: env.envId,
          traceUser: true,
        });
        this.globalData.cloudReady = true;
      } catch (e) {
        console.warn('[HackerTrip] 云开发初始化失败，降级本地数据：', e);
        this.globalData.cloudReady = false;
      }
    } else {
      console.info('[HackerTrip] 未配置 envId，使用本地 mock 数据。配置见 env.js');
    }

    // 3. 恢复本地配对码
    try {
      const code = wx.getStorageSync('ht_pair_code');
      if (code) this.globalData.pairCode = code;
    } catch (e) {}

    // 4. 恢复登录态
    try {
      const auth = wx.getStorageSync('ht_auth');
      if (auth && auth.userInfo) this.globalData.auth = auth;
    } catch (e) {}
  },
});
