const { parseAIEntry } = require('../../utils/ai.js');
const { ROLE_MAP } = require('../../utils/roles.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '分享落地',
    aiBanner: false,
    aiIntentText: 'share',
    role: {
      name: 'AI Builder',
      emoji: '⚡',
      tagline: '把想法快速变成可展示产品',
    },
    // stats / skills 在 onLoad 用真实资产统计 + 统一档案填充
    stats: { hackathons: 0, projects: 0, skills: 0 },
    skills: [],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    const role = ROLE_MAP[options.role] || this.data.role;
    const stats = api.getUserStats();
    const profile = api.getProfile();
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'share',
      role,
      stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
      skills: profile.skills || [],
    });
  },

  generateCard() {
    wx.navigateTo({ url: '/pages/identity/identity' });
  },

  onShareAppMessage() {
    return {
      title: `我在 HackerTrip 的黑客松身份：${this.data.role.name}`,
      path: '/pages/share/share',
    };
  },
});
