const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: 'Haki 聊天',
    aiBanner: false,
    aiIntentText: '匹配黑客松',
    inputValue: '',
    event: null,
    quickReplies: ['我适合参加吗', '帮我看报名时间', '推荐组队角色'],
    messages: [],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    const event = catalog.getById(options.id || options.slug) || catalog.getAll()[0];

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || '匹配黑客松',
      event,
      messages: [
        {
          role: 'assistant',
          text: '把你的项目方向、技术栈和城市偏好告诉我，我会按赛事时间、地点、赛道和奖金帮你判断适配度。',
        },
        {
          role: 'user',
          text: '我想找 AI 或开发工具方向的黑客松。',
        },
        {
          role: 'assistant',
          text: `先看这场：${event.name}。时间 ${event.startDate} - ${event.endDate}，地点 ${event.city}，赛道包含 ${(event.tracks || []).slice(0, 3).join('、')}。`,
        },
      ],
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    const value = this.data.inputValue.trim();
    if (!value) return;
    const messages = this.data.messages.concat([
      { role: 'user', text: value },
      { role: 'assistant', text: '收到。当前版本会先基于本地赛事字段给出规则化建议，后续接入模型后会返回更细的匹配理由。' },
    ]);
    this.setData({ messages, inputValue: '' });
  },

  useQuickReply(e) {
    this.setData({ inputValue: e.currentTarget.dataset.text || '' }, () => this.sendMessage());
  },
});
