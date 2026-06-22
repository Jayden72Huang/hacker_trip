const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '作品集',
    aiBanner: false,
    aiIntentText: 'portfolio',
    projects: [
      {
        name: 'Haki Match Agent',
        subtitle: '根据项目技术栈匹配黑客松和推荐赛道',
        event: 'AdventureX 2025',
        status: '已提交',
        tags: ['LLM', 'TypeScript', '匹配算法'],
      },
      {
        name: 'Pitch Deck Copilot',
        subtitle: '把 Demo、README 和路演稿整理为评委可读材料',
        event: 'ETHShanghai',
        status: '准备中',
        tags: ['AI Agent', 'Slides', 'Web3'],
      },
      {
        name: 'Realtime Judge Board',
        subtitle: '黑客松现场评分看板和队伍进度追踪',
        event: 'XR 黑客松',
        status: '获奖作品',
        tags: ['Dashboard', 'Realtime', 'Cloud'],
      },
    ],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'portfolio',
    });
  },
});
