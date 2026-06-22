const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '公开主页',
    aiBanner: false,
    aiIntentText: 'public.site',
    // profile 在 onLoad 用统一档案 + 真实资产统计组装（name 映射自档案 nickname）
    profile: {
      name: '',
      role: '',
      city: '',
      bio: '',
      stats: { hackathons: 0, projects: 0, skills: 0 },
      skills: [],
    },
    projects: [
      { name: 'Haki Match Agent', desc: '项目技术栈到黑客松赛道的匹配助手。' },
      { name: 'Pitch Deck Copilot', desc: '自动整理报名材料和路演摘要。' },
    ],
    history: [],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    const p = api.getProfile();
    const stats = api.getUserStats();
    const history = catalog.getAll({ includeEnded: true }).slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
      cityText: item.city || item.location || '待确认',
      modeText: item.modeText,
    }));

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'public.site',
      profile: {
        name: p.nickname, // wxml 用 profile.name，档案字段是 nickname
        role: p.role,
        city: p.city,
        bio: p.bio,
        stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
        skills: p.skills || [],
      },
      history,
    });
  },
});
