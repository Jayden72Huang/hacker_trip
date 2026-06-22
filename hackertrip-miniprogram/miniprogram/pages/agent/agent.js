const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: 'Agent 技能库',
    aiBanner: false,
    aiIntentText: 'agent.skills',
    agents: [
      {
        name: 'Haki Match',
        desc: '读取项目技术栈，推荐匹配度最高的黑客松和赛道。',
        status: '已启用',
        skills: ['项目扫描', '赛事匹配', '推荐理由'],
      },
      {
        name: 'Pitch Helper',
        desc: '把作品集整理成报名表、路演摘要和评委问题清单。',
        status: '待授权',
        skills: ['路演稿', '报名材料', 'Q&A'],
      },
      {
        name: 'Team Finder',
        desc: '根据角色画像和找队友状态，生成组队介绍卡。',
        status: '已启用',
        skills: ['身份卡', '组队画像', '公开主页'],
      },
    ],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'agent.skills',
    });
  },
});
