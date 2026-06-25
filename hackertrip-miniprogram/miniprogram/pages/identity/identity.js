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
    aiTools: [],
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
    profile: { nickname: '', role: '', city: '', bio: '', skills: [], github: '', avatarUrl: '', publicId: '' },
    qrReady: false,
    qrError: '',
    // 统计（onLoad 用真实用户资产派生，awards 暂无来源保留默认）
    stats: { projects: 0, hackathons: 0, awards: 0 },
    saving: false,
    savingCard: false,
    cardSaved: false,
    canvasReady: false,
    fromSync: false,
    rolePanelOpen: false,
    configPanelOpen: false,
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({ aiBanner: ai.fromAI, aiIntent: ai.intent, aiIntentText: ai.intent || '生成身份卡', aiSource: ai.source });
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    // 数据来源基线：统一用户档案的 skills + 真实资产统计
    const profile = api.getProfile();
    const userStats = api.getUserStats();
    this.setData({
      profile,
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
        this.setData({ canvasReady: true }, () => {
          this.render();
          this.loadProfileQr();
        });
      });
  },

  writeQrFile(base64) {
    return new Promise((resolve, reject) => {
      if (!wx.getFileSystemManager || !wx.env || !wx.env.USER_DATA_PATH) {
        reject(new Error('当前环境不支持写入小程序码'));
        return;
      }
      const filePath = `${wx.env.USER_DATA_PATH}/hackertrip-profile-qr-${Date.now()}.png`;
      wx.getFileSystemManager().writeFile({
        filePath,
        data: base64,
        encoding: 'base64',
        success: () => resolve(filePath),
        fail: reject,
      });
    });
  },

  loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.canvas.createImage) {
        reject(new Error('Canvas 未准备好'));
        return;
      }
      const img = this.canvas.createImage();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  async loadProfileQr(options) {
    const opts = options || {};
    if (!this.data.canvasReady || this.data.qrReady) return;
    if (!api.isLoggedIn()) {
      this.setData({ qrError: '登录后生成小程序码' }, () => this.render());
      if (!opts.promptLogin) return;
      const auth = await api.requireAuth(this, '/pages/identity/identity', '登录后才能生成带小程序码的身份卡，并同步到你的公开 profile。');
      if (!auth) return;
    }
    const res = await api.getProfileQr(this.data.profile);
    if (!res || !res.ok || !res.base64) {
      this.setData({ qrError: (res && res.message) || '小程序码生成失败' }, () => this.render());
      return;
    }
    try {
      const filePath = await this.writeQrFile(res.base64);
      this.qrImage = await this.loadCanvasImage(filePath);
      this.setData({
        qrReady: true,
        qrError: '',
        'profile.publicId': res.uid || this.data.profile.publicId,
      }, () => this.render());
    } catch (err) {
      this.setData({ qrError: '小程序码加载失败' }, () => this.render());
    }
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
      profile: this.data.profile,
      qrImage: this.qrImage,
    }, this.dpr);
  },

  /* ---------------- 表单交互 ---------------- */
  switchVariant(e) {
    this.setData({ variant: e.currentTarget.dataset.v }, () => this.render());
  },
  goEditProfile() {
    wx.navigateTo({ url: '/pages/identity-edit/identity-edit' });
  },
  goSyncSkills() {
    wx.navigateTo({ url: '/pages/sync/sync' });
  },
  async regenerateCard() {
    const auth = await api.requireAuth(this, '/pages/identity/identity', '登录后才能生成带小程序码的身份卡，并同步到你的公开 profile。');
    if (!auth) return;
    const profile = api.getProfile();
    const userStats = api.getUserStats();
    this.setData({
      profile,
      techStack: (profile.skills && profile.skills.length) ? profile.skills.slice() : this.data.techStack,
      stats: { projects: userStats.projects, hackathons: userStats.hackathons, awards: this.data.stats.awards },
      qrReady: false,
      qrError: '',
      cardSaved: false,
    }, () => {
      this.recompute();
      this.loadProfileQr({ promptLogin: true });
      wx.showToast({ title: '已刷新身份卡', icon: 'none' });
    });
  },
  lockRole(e) {
    this.recompute(e.currentTarget.dataset.key);
  },
  toggleRolePanel() {
    this.setData({ rolePanelOpen: !this.data.rolePanelOpen });
  },
  toggleConfigPanel() {
    this.setData({ configPanelOpen: !this.data.configPanelOpen });
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
      profileUid: this.data.profile.publicId || '',
    };
  },

  async saveCard(options) {
    const opts = options || {};
    if (this.data.savingCard) return null;
    const auth = await api.requireAuth(this, '/pages/identity/identity', '登录后才能保存身份卡，并同步到你的公开 profile。');
    if (!auth) return null;
    this.setData({ savingCard: true });
    try {
      const card = await api.saveCard(this.buildCardData());
      this.setData({ cardSaved: true });
      if (!opts.silent) wx.showToast({ title: '已保存到「我的」', icon: 'success' });
      return card;
    } catch (e) {
      if (!opts.silent) wx.showToast({ title: '身份卡同步失败，请重试', icon: 'none' });
      return null;
    } finally {
      this.setData({ savingCard: false });
    }
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
    const auth = await api.requireAuth(this, '/pages/identity/identity', '登录后才能生成带小程序码的身份卡图片。');
    if (!auth) return;
    if (this.data.saving) return;
    if (!this.data.canvasReady || !this.canvas) {
      wx.showToast({ title: '卡片生成中，请稍候', icon: 'none' });
      return;
    }
    if (!this.data.qrReady) {
      wx.showToast({ title: this.data.qrError || '小程序码生成中，请稍候', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      const saved = await this.saveCard({ silent: true });
      if (!saved) throw new Error('身份卡同步失败');
      const path = await this.exportImage();
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({ filePath: path, success: resolve, fail: reject });
      });
      wx.showToast({ title: '已保存身份卡', icon: 'success' });
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

  async shareCard() {
    // 保存并跳到分享落地页预览
    const saved = await this.saveCard();
    if (!saved) return;
    wx.navigateTo({ url: `/pages/share/share?${this.buildShareQuery()}` });
  },

  prepareShare() {
    if (!this.data.qrReady) return;
    this.saveCard({ silent: true });
  },

  buildShareQuery() {
    const params = [
      `role=${encodeURIComponent(this.data.role)}`,
      `variant=${encodeURIComponent(this.data.variant)}`,
    ];
    const uid = this.data.profile && this.data.profile.publicId;
    if (uid) params.push(`uid=${encodeURIComponent(uid)}`);
    return params.join('&');
  },

  onShareAppMessage() {
    const role = this.data.roleMeta || ROLE_MAP.zero_to_one;
    return {
      title: `我在黑客松里是「${role.name}」${role.emoji}，看看你是什么角色`,
      path: `/pages/share/share?${this.buildShareQuery()}`,
    };
  },
  onShareTimeline() {
    const role = this.data.roleMeta || ROLE_MAP.zero_to_one;
    return {
      title: `我的黑客松身份：${role.name} ${role.emoji}`,
      query: this.buildShareQuery(),
    };
  },

  onAuthLogin() {
    if (!this.data.qrReady) this.loadProfileQr();
  },
});
