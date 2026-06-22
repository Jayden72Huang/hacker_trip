const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '设置',
    aiBanner: false,
    aiIntentText: 'settings',
    noticeOn: true,
    account: {
      name: '', // onLoad 读统一档案 nickname
      login: '微信已登录',
      sync: 'Skills 最近同步：今天',
    },
    rows: [
      { label: '隐私设置', value: '公开主页展示昵称、城市、技能和作品摘要' },
      { label: '缓存管理', value: '本地缓存赛事、收藏、身份卡和同步结果' },
    ],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'settings',
      'account.name': api.getProfile().nickname,
    });
  },

  onNoticeChange(e) {
    this.setData({ noticeOn: e.detail.value });
  },

  logout() {
    wx.showToast({ title: '已退出登录', icon: 'none' });
  },
});
