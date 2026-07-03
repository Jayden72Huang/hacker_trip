const api = require('../../utils/api.js');

Page({
  data: {
    title: '可信履历',
    loading: true,
    achievements: [],
  },

  async onShow() {
    await this.load();
  },

  async load() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const res = await api.listAchievements();
    this.setData({
      loading: false,
      achievements: res && Array.isArray(res.achievements) ? res.achievements : [],
    });
  },
});
