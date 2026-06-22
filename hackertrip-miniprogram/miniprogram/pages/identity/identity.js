const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');
const { decideRole, ROLE_MAP, ROLES, PLAY_STYLE_META, LOOKING_FOR_META } = require('../../utils/roles.js');
const { drawCard, W, H } = require('../../utils/card-canvas.js');

const TECH_PRESETS = ['TypeScript', 'Python', 'Rust', 'Go', 'Next.js', 'React', 'FastAPI', 'PyTorch', 'LangChain', 'Solidity', 'Flutter', 'Three.js'];
const AI_PRESETS = ['Claude', 'Claude Code', 'Cursor', 'Copilot', 'ChatGPT', 'Gemini', 'v0', 'Codex'];

Page({
  data: {
    title: '身份卡',
    aiBanner: false,
    aiIntent: '',
    aiIntentText: '生成身份卡',
    aiSource: 'direct',
    variant: 'identity', // identity | config
    // 表单（techStack 在 onLoad 用统一档案 skills 初始化）
    techStack: [],
    aiTools: ['Claude Code'],
    playStyleIdx: 0,
    lookingForIdx: 1,
    techInput: '',
    aiInput: '',
    // 派生
    role: 'zero_to_one',
    roleMeta: null,
    secondary: [],
    reasons: [],
    // 预置
    techPresets: TECH_PRESETS,
    aiPresets: AI_PRESETS,
    playStyles: Object.keys(PLAY_STYLE_META).map((k) => ({ key: k, ...PLAY_STYLE_META[k] })),
    lookingFors: Object.keys(LOOKING_FOR_META).map((k) => ({ key: k, ...LOOKING_FOR_META[k] })),
    roleList: ROLES.map((r) => ({ key: r.key, name: r.name, emoji: r.emoji })),
    // 统计（onLoad 用真实用户资产派生，awards 暂无来源保留默认）
    stats: { projects: 0, hackathons: 0, awards: 1 },
    saving: false,
    canvasReady: false,
    fromSync: false,
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({ aiBanner: ai.fromAI, aiIntent: ai.intent, aiIntentText: ai.intent || '生成身份卡', aiSource: ai.source });
    // 数据来源基线：统一用户档案的 skills + 真实资产统计
    const profile = api.getProfile();
    const userStats = api.getUserStats();
    this.setData({
      techStack: (profile.skills && profile.skills.length) ? profile.skills.slice() : this.data.techStack,
      stats: { projects: userStats.projects, hackathons: userStats.hackathons, awards: this.data.stats.awards },
    });
    // 若有 Skills 同步过来的身份信息，优先覆盖
    const scan = api.getScanResults();
    if (scan && scan.identity) {
      const id = scan.identity;
      this.setData({
        techStack: id.techStack || this.data.techStack,
        playStyleIdx: Math.max(0, this.data.playStyles.findIndex((p) => p.key === id.playStyle)),
        lookingForIdx: Math.max(0, this.data.lookingFors.findIndex((l) => l.key === id.lookingFor)),
        stats: { projects: id.projects || this.data.stats.projects, hackathons: id.hackathons || this.data.stats.hackathons, awards: id.awards || this.data.stats.awards },
        fromSync: true,
      });
    }
    this.recompute();
  },

  onReady() {
    this.initCanvas();
  },

  /* ---------------- 角色判定 ---------------- */
  recompute(manual) {
    const signals = {
      techStack: this.data.techStack,
      taglineKeywords: this.data.aiTools,
      participantRoles: [],
      projectCount: this.data.stats.projects,
      winCount: this.data.stats.awards,
      shippingVelocity: this.data.stats.hackathons ? this.data.stats.projects / this.data.stats.hackathons : 0,
    };
    const result = decideRole(signals, manual || null);
    const top = result.scores.find((s) => s.key === result.primary);
    this.setData({
      role: result.primary,
      roleMeta: ROLE_MAP[result.primary],
      secondary: result.secondary,
      reasons: top ? top.reasons.slice(0, 3) : [],
    }, () => this.render());
  },

  /* ---------------- Canvas ---------------- */
  initCanvas() {
    const q = wx.createSelectorQuery();
    q.select('#cardCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = dpr;
        this.setData({ canvasReady: true }, () => this.render());
      });
  },

  render() {
    if (!this.ctx) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, W * this.dpr, H * this.dpr);
    drawCard(this.ctx, {
      variant: this.data.variant,
      role: this.data.role,
      secondary: this.data.secondary,
      techStack: this.data.techStack,
      aiTools: this.data.aiTools,
      playStyle: this.data.playStyles[this.data.playStyleIdx].key,
      lookingFor: this.data.lookingFors[this.data.lookingForIdx].key,
      projects: this.data.stats.projects,
      hackathons: this.data.stats.hackathons,
      awards: this.data.stats.awards,
    }, this.dpr);
  },

  /* ---------------- 表单交互 ---------------- */
  switchVariant(e) {
    this.setData({ variant: e.currentTarget.dataset.v }, () => this.render());
  },
  lockRole(e) {
    this.recompute(e.currentTarget.dataset.key);
  },
  togglePreset(e) {
    const { field, value } = e.currentTarget.dataset;
    const list = this.data[field].slice();
    const i = list.indexOf(value);
    if (i === -1) list.push(value); else list.splice(i, 1);
    this.setData({ [field]: list }, () => this.recompute());
  },
  onTechInput(e) { this.setData({ techInput: e.detail.value }); },
  onAiInput(e) { this.setData({ aiInput: e.detail.value }); },
  addTech() {
    const v = this.data.techInput.trim();
    if (v && this.data.techStack.indexOf(v) === -1) {
      this.setData({ techStack: this.data.techStack.concat(v), techInput: '' }, () => this.recompute());
    }
  },
  addAi() {
    const v = this.data.aiInput.trim();
    if (v && this.data.aiTools.indexOf(v) === -1) {
      this.setData({ aiTools: this.data.aiTools.concat(v), aiInput: '' }, () => this.recompute());
    }
  },
  removeTech(e) {
    const list = this.data.techStack.slice();
    list.splice(e.currentTarget.dataset.idx, 1);
    this.setData({ techStack: list }, () => this.recompute());
  },
  pickPlay(e) {
    this.setData({ playStyleIdx: e.currentTarget.dataset.idx }, () => this.render());
  },
  pickLooking(e) {
    this.setData({ lookingForIdx: e.currentTarget.dataset.idx }, () => this.render());
  },

  /* ---------------- 保存 / 分享 ---------------- */
  buildCardData() {
    return {
      id: 'card-' + this.data.variant + '-' + (this.data.role),
      variant: this.data.variant,
      role: this.data.role,
      secondary: this.data.secondary,
      techStack: this.data.techStack,
      aiTools: this.data.aiTools,
      playStyle: this.data.playStyles[this.data.playStyleIdx].key,
      lookingFor: this.data.lookingFors[this.data.lookingForIdx].key,
      projects: this.data.stats.projects,
      hackathons: this.data.stats.hackathons,
      awards: this.data.stats.awards,
    };
  },

  saveCard() {
    const card = api.saveCard(this.buildCardData());
    wx.showToast({ title: '已保存到「我的」', icon: 'success' });
    return card;
  },

  exportImage() {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (r) => resolve(r.tempFilePath),
        fail: reject,
      });
    });
  },

  async saveToAlbum() {
    if (this.data.saving) return;
    if (!this.data.canvasReady || !this.canvas) {
      wx.showToast({ title: '卡片生成中，请稍候', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      const path = await this.exportImage();
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({ filePath: path, success: resolve, fail: reject });
      });
      wx.showToast({ title: '已保存到相册', icon: 'success' });
    } catch (e) {
      if (e && /auth|deny|scope/i.test(JSON.stringify(e))) {
        wx.showModal({ title: '需要相册权限', content: '请在设置中允许保存到相册', confirmText: '去设置', success: (r) => { if (r.confirm) wx.openSetting(); } });
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } finally {
      this.setData({ saving: false });
    }
  },

  shareCard() {
    // 保存并跳到分享落地页预览
    this.saveCard();
    const c = this.buildCardData();
    wx.navigateTo({ url: `/pages/share/share?role=${c.role}&variant=${c.variant}` });
  },

  onShareAppMessage() {
    const role = this.data.roleMeta || ROLE_MAP.zero_to_one;
    return {
      title: `我在黑客松里是「${role.name}」${role.emoji}，看看你是什么角色`,
      path: `/pages/share/share?role=${this.data.role}&variant=${this.data.variant}`,
    };
  },
  onShareTimeline() {
    const role = this.data.roleMeta || ROLE_MAP.zero_to_one;
    return {
      title: `我的黑客松身份：${role.name} ${role.emoji}`,
      query: `role=${this.data.role}&variant=${this.data.variant}`,
    };
  },
});
