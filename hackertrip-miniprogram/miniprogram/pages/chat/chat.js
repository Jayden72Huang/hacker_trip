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
    quickReplies: ['🔑 我有好友暗号', '推荐适合我的赛事', '按城市筛选赛事'],
    messages: [],
    subtitle: '告诉 Haki 你的项目方向、技术栈、城市偏好和时间安排，它会帮你推荐合适的黑客松。',
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    const eventId = options.id || options.slug;
    const event = eventId ? catalog.getById(eventId) : null;

    // 开场只放一条助手引导语；只有从赛事详情进入时才挂载赛事上下文。
    const welcome = event
      ? `我是 Haki。把你的项目方向、技术栈和城市偏好告诉我，我会按赛事的时间、地点、赛道和奖金帮你判断适配度。比如想了解「${event.shortName || event.name}」也可以直接问。`
      : '我是 Haki。把你的项目方向、技术栈、城市偏好告诉我，我会帮你推荐黑客松。\n\n🔑 有朋友给了你「暗号」(像 HT-7K3D)？直接发给我，我帮你们做组队雷达，还能解锁限定身份卡。';

    // 支持从分享/卡片带暗号直接进入：chat?invite=HT-XXXX
    const incomingInvite = (options && (options.invite || options.code)) || '';

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || '匹配黑客松',
      event,
      quickReplies: event
        ? ['我适合参加吗', '帮我看报名时间', '推荐组队角色']
        : ['🔑 我有好友暗号', '推荐适合我的赛事', '帮我规划参赛方向'],
      subtitle: event
        ? '已挂载当前赛事，Haki 会结合赛事名称、时间、城市、奖金和赛道回答。'
        : '告诉 Haki 你的项目方向、技术栈、城市偏好和时间安排，它会帮你推荐合适的黑客松。',
      messages: [{ role: 'assistant', text: welcome }],
    }, () => {
      if (incomingInvite) this.handleInvite(String(incomingInvite));
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  /** 暗号正则：HT- 后 4 位（容错大小写、缺连字符） */
  matchInviteCode(text) {
    const m = String(text || '').toUpperCase().match(/HT-?([0-9A-Z]{4})/);
    return m ? `HT-${m[1]}` : '';
  },

  /** 弹出可编辑输入框，引导用户填好友暗号 */
  openInvitePrompt() {
    wx.showModal({
      title: '输入好友暗号',
      content: '',
      editable: true,
      placeholderText: '例如 HT-7K3D',
      confirmText: '识别',
      success: (r) => {
        if (!r.confirm) return;
        const code = this.matchInviteCode(r.content);
        if (!code) {
          wx.showToast({ title: '暗号格式像 HT-7K3D', icon: 'none' });
          return;
        }
        this.handleInvite(code);
      },
    });
  },

  async sendMessage() {
    const value = this.data.inputValue.trim();
    if (!value || this.data.sending) return;

    // 暗号优先：识别到 HT-XXXX 直接走组队雷达流程，不当普通提问
    const inviteCode = this.matchInviteCode(value);
    if (inviteCode) {
      this.setData({ inputValue: '' });
      return this.handleInvite(inviteCode);
    }

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
  async streamReply(value, history, replyIndex, opts) {
    if (!api.cloudReady() || !wx.cloud.extend || !wx.cloud.extend.AI) return false;
    const inviteContext = (opts && opts.inviteContext) || null;

    // 1. 云端装配 prompt（含真实赛事上下文 + system prompt）
    let prep;
    try {
      prep = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'aiChat',
          data: { mode: 'prepare', message: value, history, focusEventId: this.data.event && this.data.event.id, inviteContext },
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
  async fallbackReply(value, history, replyIndex, opts) {
    let reply;
    try {
      const histForApi = history.map((m) => ({ role: m.role, text: m.content }));
      const res = await api.aiChat(value, histForApi, this.data.event && this.data.event.id, opts || {});
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
    const text = e.currentTarget.dataset.text || '';
    if (text.indexOf('🔑') !== -1) {
      this.openInvitePrompt();
      return;
    }
    this.setData({ inputValue: text }, () => this.sendMessage());
  },

  /**
   * 处理好友暗号（F1 核心）：核销 → 拿邀请人画像 → 让 Haki 现场生成组队雷达锐评 → 解锁限定卡。
   */
  async handleInvite(code) {
    if (this.data.sending) return;
    // 需要登录才能绑定 referral / 解锁（云端模式）
    if (!api.isLoggedIn() && api.cloudReady()) {
      const auth = await api.requireAuth(this, '/pages/chat/chat?invite=' + code, '登录后才能识别好友暗号、解锁限定身份卡。');
      if (!auth) return;
    }

    // 用户气泡（展示暗号）+ 空助手气泡
    const baseMessages = this.data.messages.concat([{ role: 'user', text: `🔑 好友暗号 ${code}` }]);
    const replyIndex = baseMessages.length;
    this.setData({
      messages: baseMessages.concat([{ role: 'assistant', text: '', pending: true }]),
      sending: true,
    });

    let res;
    try {
      res = await api.redeemInvite(code);
    } catch (e) {
      res = { ok: false, message: '暗号核销失败，稍后再试' };
    }

    if (!res || !res.ok) {
      this.patchReply(replyIndex, (res && res.message) || '这个暗号好像不对，确认一下再发给我？', false);
      this.setData({ sending: false });
      return;
    }

    // 组装组队雷达上下文：邀请人画像 + 我的画像
    const me = api.getProfile();
    const inviteContext = {
      inviter: res.inviter || {},
      me: { role: me.role || '', city: me.city || '', skills: me.skills || [] },
    };
    const radarPrompt = `我刚用了好友「${(res.inviter && res.inviter.name) || '队友'}」的暗号 ${code}，帮我做组队雷达。`;
    const history = baseMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.text }));

    if (!api.cloudReady()) {
      // 本地/离线：直接给组队雷达兜底文案，保证开发者工具可演示
      this.patchReply(replyIndex, this.localRadarText(res.inviter), false);
      this.setData({ sending: false });
    } else {
      try {
        const streamed = await this.streamReply(radarPrompt, history, replyIndex, { inviteContext });
        if (!streamed) await this.fallbackReply(radarPrompt, history, replyIndex, { inviteContext });
      } catch (e) {
        this.patchReply(replyIndex, this.localRadarText(res.inviter), false);
      } finally {
        this.setData({ sending: false });
      }
    }

    // 解锁反馈
    if (res.firstTime && Array.isArray(res.unlocked) && res.unlocked.length) {
      wx.showToast({ title: '🎉 解锁「被邀请限定卡」', icon: 'none', duration: 2200 });
    } else if (res.alreadyRedeemed) {
      wx.showToast({ title: '这个暗号你已经用过啦', icon: 'none' });
    }
  },

  /** 云端不可用时的本地组队雷达兜底文案 */
  localRadarText(inviter) {
    const a = inviter || {};
    const name = a.name || '你的朋友';
    const skills = Array.isArray(a.skills) && a.skills.length ? a.skills.join('、') : '一身好本事';
    return `收到 ${name} 的暗号！ta 擅长 ${skills}${a.city ? `，在${a.city}` : ''}。你俩组队互补性不错，建议一起挑一场近期的 AI 赛道黑客松练手。想让我从赛事清单里精确推荐，连上网络再问我一次～顺手生成你自己的暗号，也能拉朋友解锁限定卡。`;
  },

  onAuthLogin() {},
});
