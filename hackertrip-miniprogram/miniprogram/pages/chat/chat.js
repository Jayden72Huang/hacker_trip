const catalog = require('../../utils/catalog.js');
const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: 'Haki 聊天',
    aiBanner: false,
    aiIntentText: '匹配黑客松',
    inputValue: '',
    event: null,
    sending: false,
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

  async sendMessage() {
    const value = this.data.inputValue.trim();
    if (!value || this.data.sending) return;

    // 先把用户气泡 + 占位的"思考中"助手气泡渲染出来
    const baseMessages = this.data.messages.concat([{ role: 'user', text: value }]);
    const thinkingIndex = baseMessages.length; // 占位气泡的下标
    this.setData({
      messages: baseMessages.concat([{ role: 'assistant', text: '思考中…', pending: true }]),
      inputValue: '',
      sending: true,
    });

    // 历史只取真实对话（排除刚加的占位气泡）
    const history = baseMessages;

    let reply;
    try {
      const res = await api.aiChat(value, history);
      reply = (res && res.reply) || '我没太理解，换个说法再问一次？';
    } catch (e) {
      console.warn('[chat] aiChat 异常', e);
      reply = '出了点问题，稍后再试一次。';
    }

    // 用真实回答替换占位气泡
    const messages = this.data.messages.slice();
    messages[thinkingIndex] = { role: 'assistant', text: reply };
    this.setData({ messages, sending: false });
  },

  useQuickReply(e) {
    if (this.data.sending) return;
    this.setData({ inputValue: e.currentTarget.dataset.text || '' }, () => this.sendMessage());
  },
});
