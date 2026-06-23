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

    // 开场只放一条助手引导语，不再预置写死的假对话
    const welcome = event
      ? `我是 Haki。把你的项目方向、技术栈和城市偏好告诉我，我会按赛事的时间、地点、赛道和奖金帮你判断适配度。比如想了解「${event.shortName || event.name}」也可以直接问。`
      : '我是 Haki。把你的项目方向、技术栈和城市偏好告诉我，我会按赛事的时间、地点、赛道和奖金帮你判断适配度。';

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || '匹配黑客松',
      event,
      messages: [{ role: 'assistant', text: welcome }],
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const value = this.data.inputValue.trim();
    if (!value || this.data.sending) return;

    // 用户气泡 + 空助手气泡（pending：显示打字光标，等待逐字填充）
    const baseMessages = this.data.messages.concat([{ role: 'user', text: value }]);
    const replyIndex = baseMessages.length; // 助手气泡下标
    this.setData({
      messages: baseMessages.concat([{ role: 'assistant', text: '', pending: true }]),
      inputValue: '',
      sending: true,
    });

    // 历史只取真实对话（不含刚加的空助手气泡）
    const history = baseMessages.map((m) => ({ role: m.role, content: m.text }));

    try {
      const streamed = await this.streamReply(value, history, replyIndex);
      if (!streamed) {
        // 流式不可用：降级到云函数非流式一次性回答
        await this.fallbackReply(value, history, replyIndex);
      }
    } catch (e) {
      console.warn('[chat] 回答失败', e);
      this.patchReply(replyIndex, '出了点问题，稍后再试一次。', false);
    } finally {
      this.setData({ sending: false });
    }
  },

  /**
   * 流式回答：云函数 prepare 拿注入赛事 context 的 messages，
   * 再用 wx.cloud.extend.AI.streamText 在前端逐字生成（打字机效果）。
   * 返回 true 表示已流式完成，false 表示环境不支持需走降级。
   */
  async streamReply(value, history, replyIndex) {
    if (!api.cloudReady() || !wx.cloud.extend || !wx.cloud.extend.AI) return false;

    // 1. 云端装配 prompt（含真实赛事上下文 + system prompt）
    let prep;
    try {
      prep = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'aiChat',
          data: { mode: 'prepare', message: value, history, focusEventId: this.data.event && this.data.event.id },
          success: (res) => resolve(res.result),
          fail: reject,
        });
      });
    } catch (e) {
      console.warn('[chat] prepare 失败，降级非流式', e);
      return false;
    }
    if (!prep || !prep.ok || !Array.isArray(prep.messages)) return false;

    // 2. 前端流式生成，onText 逐字追加
    const model = wx.cloud.extend.AI.createModel(prep.provider || 'hunyuan-exp');
    let acc = '';
    try {
      // 只用 textStream 逐字消费(增量 chunk)，不要再叠加 onText，否则同一段内容会被累积两次(重复 bug)
      const res = await model.streamText({
        data: { model: prep.model, messages: prep.messages },
      });
      for await (const chunk of res.textStream) {
        if (chunk) {
          acc += chunk;
          this.patchReply(replyIndex, acc, true);
        }
      }
    } catch (e) {
      console.warn('[chat] streamText 失败', e);
      if (!acc) return false; // 一个字都没出，交给降级
    }

    const finalText = acc.trim() || '我没太理解，换个说法再问一次？';
    this.patchReply(replyIndex, finalText, false);
    return true;
  },

  /** 降级：调 api.aiChat 非流式，一次性替换助手气泡 */
  async fallbackReply(value, history, replyIndex) {
    let reply;
    try {
      const histForApi = history.map((m) => ({ role: m.role, text: m.content }));
      const res = await api.aiChat(value, histForApi, this.data.event && this.data.event.id);
      reply = (res && res.reply) || '我没太理解，换个说法再问一次？';
    } catch (e) {
      console.warn('[chat] aiChat 降级异常', e);
      reply = '出了点问题，稍后再试一次。';
    }
    this.patchReply(replyIndex, reply, false);
  },

  /** 更新指定助手气泡的文本与 pending 态 */
  patchReply(index, text, pending) {
    this.setData({
      [`messages[${index}].text`]: text,
      [`messages[${index}].pending`]: pending,
    });
  },

  useQuickReply(e) {
    if (this.data.sending) return;
    this.setData({ inputValue: e.currentTarget.dataset.text || '' }, () => this.sendMessage());
  },
});
