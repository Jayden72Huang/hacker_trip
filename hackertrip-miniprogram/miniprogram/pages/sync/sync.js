const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: 'Skills 同步',
    aiBanner: false,
    aiIntentText: 'skills.sync',
    code: '',
    syncing: false,
    synced: false,
    statusText: '等待输入 6 位配对码',
    steps: [
      { title: '桌面端扫描项目', desc: 'HackerTrip CLI 读取技术栈、项目简介和可公开的作品信息。' },
      { title: '生成 6 位配对码', desc: '配对码只用于本次同步，不展示密钥或本地路径。' },
      { title: '小程序拉取结果', desc: '同步后可生成匹配结果、身份卡和公开主页。' },
    ],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'skills.sync',
      code: options.pairCode || options.code || '',
    });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value.replace(/\D/g, '').slice(0, 6) });
  },

  async syncNow() {
    if (this.data.syncing) return;
    if (this.data.code.length !== 6) {
      wx.showToast({ title: '请输入 6 位配对码', icon: 'none' });
      return;
    }
    this.setData({ syncing: true, statusText: '正在同步 Skills 数据...' });
    const res = await api.pullSyncByCode(this.data.code);
    if (res && res.ok) {
      this.setData({ synced: true, statusText: res.mock ? '已载入同步结果' : '同步成功' });
      wx.showToast({ title: '同步成功', icon: 'success' });
    } else {
      this.setData({ statusText: (res && res.message) || '同步失败，请稍后重试' });
      wx.showToast({ title: '同步失败', icon: 'none' });
    }
    this.setData({ syncing: false });
  },

  goMatch() {
    wx.navigateTo({ url: '/pages/match/match' });
  },
});
