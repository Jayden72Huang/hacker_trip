const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '登录',
    aiBanner: false,
    aiIntentText: 'login',
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'login',
    });
  },

  onGetUserInfo() {
    wx.showToast({ title: '登录成功', icon: 'success' });
  },
});
