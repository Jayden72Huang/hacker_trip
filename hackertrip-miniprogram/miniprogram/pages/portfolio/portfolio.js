const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '作品集',
    aiBanner: false,
    aiIntentText: 'portfolio',
    projects: [],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'portfolio',
      projects: api.getPortfolioProjects(),
    });
  },
});
