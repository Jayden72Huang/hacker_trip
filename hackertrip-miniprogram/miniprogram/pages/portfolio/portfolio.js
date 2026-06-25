const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '作品集',
    aiBanner: false,
    aiIntentText: 'portfolio',
    projects: [],
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'portfolio',
      projects: api.getPortfolioProjects(),
    });
  },

  async onShow() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    this.setData({ projects: api.getPortfolioProjects() });
  },
});
