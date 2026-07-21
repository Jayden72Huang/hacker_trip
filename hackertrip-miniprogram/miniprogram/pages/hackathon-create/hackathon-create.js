const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '发布黑客松',
    aiBanner: false,
    aiIntentText: 'hackathon.create',
    allowed: false,
    submitMode: 'manual',
    submitting: false,
    pairCreating: false,
    pairCode: '',
    pairUploadToken: '',
    pairExpireAt: '',
    pairExpireText: '',
    pairCountdown: '',
    pairStatusText: '点下面的按钮，拿到 6 位提交码和一把提交密钥，再把命令复制到电脑终端就能提交。',
    form: {
      name: '',
      city: '',
      mode: 'offline',
      startDate: '',
      endDate: '',
      prizePool: '',
      tracks: '',
      website: '',
      summary: '',
    },
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'hackathon.create',
      allowed: api.isOrganizerApproved(),
    });
    this.refreshAllowed();
  },

  onUnload() {
    this.clearPairTimer();
  },

  async refreshAllowed() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    this.setData({ allowed: api.isOrganizerApproved() });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  chooseMode(e) {
    this.setData({ 'form.mode': e.currentTarget.dataset.mode || 'offline' });
  },

  switchSubmitMode(e) {
    const mode = e.currentTarget.dataset.mode || 'manual';
    this.setData({ submitMode: mode === 'agent' ? 'agent' : 'manual' });
  },

  goApply() {
    wx.redirectTo({ url: '/pages/organizer/organizer' });
  },

  onAuthLogin() {
    this.refreshAllowed();
  },

  clearPairTimer() {
    if (this.pairTimer) {
      clearInterval(this.pairTimer);
      this.pairTimer = null;
    }
  },

  formatExpireAt(expireAt) {
    if (!expireAt) return '';
    const date = new Date(expireAt);
    if (Number.isNaN(date.getTime())) return String(expireAt);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  updatePairCountdown() {
    const expireAt = this.data.pairExpireAt;
    if (!expireAt) return;
    const time = new Date(expireAt).getTime();
    if (Number.isNaN(time)) {
      this.setData({ pairCountdown: '30 分钟内有效' });
      return;
    }
    const remaining = Math.max(0, time - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    this.setData({
      pairCountdown: remaining > 0 ? `${minutes}分${String(seconds).padStart(2, '0')}秒后过期` : '已过期，请重新生成',
    });
    if (remaining <= 0) this.clearPairTimer();
  },

  startPairTimer() {
    this.clearPairTimer();
    this.updatePairCountdown();
    this.pairTimer = setInterval(() => this.updatePairCountdown(), 1000);
  },

  async createSubmitPair() {
    if (this.data.pairCreating) return;
    const auth = await api.requireAuth(this, '/pages/hackathon-create/hackathon-create', '登录后才能生成赛事提交码。');
    if (!auth) return;
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    if (!api.isOrganizerApproved()) {
      this.setData({ allowed: false });
      wx.showToast({ title: '需先通过组织者认证', icon: 'none' });
      return;
    }
    this.setData({ pairCreating: true, pairStatusText: '正在生成提交码...' });
    const res = await api.createEventSubmitPair();
    this.setData({ pairCreating: false });
    if (res && res.ok && res.code && res.uploadToken) {
      this.setData({
        pairCode: res.code,
        pairUploadToken: res.uploadToken,
        pairExpireAt: res.expireAt || '',
        pairExpireText: this.formatExpireAt(res.expireAt),
        pairStatusText: '已生成，30 分钟内一次性有效。',
      }, () => this.startPairTimer());
      wx.showToast({ title: '提交码已生成', icon: 'success' });
      return;
    }
    const messageMap = {
      NOT_ORGANIZER: '需先通过组织者认证',
      NO_OPENID: '请先登录后再生成提交码',
      CLOUD_REQUIRED: '需要连接云开发后才能生成提交码',
    };
    const message = messageMap[res && res.code] || (res && res.message) || '提交码生成失败，请稍后重试';
    this.setData({ pairStatusText: message });
    wx.showToast({ title: message, icon: 'none' });
  },

  copyPairCode() {
    if (!this.data.pairCode) {
      wx.showToast({ title: '请先生成提交码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.pairCode,
      success: () => wx.showToast({ title: '提交码已复制', icon: 'success' }),
    });
  },

  copyPairToken() {
    if (!this.data.pairUploadToken) {
      wx.showToast({ title: '请先生成密钥', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.pairUploadToken,
      success: () => wx.showToast({ title: '密钥已复制', icon: 'success' }),
    });
  },

  copyCliCommand() {
    const command = [
      'npx hackertrip --help',
      'npm i -g hackertrip',
    ].join('\n');
    wx.setClipboardData({
      data: command,
      success: () => wx.showToast({ title: '安装命令已复制', icon: 'success' }),
    });
  },

  copyEventJsonTemplate() {
    const template = {
      name: '赛事名称',
      city: '城市 / 线上',
      mode: 'offline',
      startDate: 'YYYY-MM-DD',
      endDate: 'YYYY-MM-DD',
      website: 'https://',
      prizePool: '奖金 / 资源',
      tracks: 'AI Agent, Web3, 硬件',
      summary: '一句话说明活动主题、参赛对象、亮点和报名要求',
    };
    wx.setClipboardData({
      data: JSON.stringify(template, null, 2),
      success: () => wx.showToast({ title: '赛事资料模板已复制', icon: 'success' }),
    });
  },

  copySubmitCommand() {
    const pairCode = this.data.pairCode || 'PAIR_CODE';
    const syncToken = this.data.pairUploadToken || 'UPLOAD_TOKEN';
    const command = [
      'npx hackertrip submit-event \\',
      `  --pair-code ${pairCode} \\`,
      `  --sync-token ${syncToken} \\`,
      '  --from event.json',
    ].join('\n');
    wx.setClipboardData({
      data: command,
      success: () => wx.showToast({ title: '提交命令已复制', icon: 'success' }),
    });
  },

  async submitHackathon() {
    if (this.data.submitting) return;
    // 审核结果订阅授权必须在 tap 手势链内先唤起（await 之后 iOS 真机会丢手势被拒）
    api.requestMessageSubscriptions([api.SUBSCRIBE_TYPES.AUDIT_RESULT], 'hackathon_submit').catch(() => {});
    this.setData({ submitting: true });
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    if (!api.isOrganizerApproved()) {
      this.setData({ allowed: false, submitting: false });
      wx.showToast({ title: '需先通过组织者认证', icon: 'none' });
      return;
    }
    const form = this.data.form;
    if (!form.name.trim() || !form.city.trim() || !form.startDate.trim() || !form.endDate.trim() || !form.website.trim()) {
      this.setData({ submitting: false });
      wx.showToast({ title: '请补全名称、城市、时间和官网', icon: 'none' });
      return;
    }
    const res = await api.submitHackathonDraft(form);
    this.setData({ submitting: false });
    if (!res || !res.ok) {
      const messageMap = {
        CLOUD_REQUIRED: '需要连接云开发后才能提交审核',
        NOT_ORGANIZER: '需先通过组织者认证',
        CONTENT_RISKY: '内容未通过安全检测，请修改后重试',
        SECURITY_CHECK_FAILED: '内容安全检测失败，请稍后重试',
      };
      wx.showModal({
        title: '提交失败',
        content: messageMap[res && res.code] || (res && res.message) || '提交审核失败，请稍后重试',
        showCancel: false,
      });
      return;
    }
    const content = res.status === 'security_review'
      ? '赛事已提交，微信安全检测建议人工复核。平台审核通过后才会进入赛事库。'
      : '赛事已通过微信文本安全检测，并进入平台审核。审核通过后会进入 HackerTrip 赛事库。';
    wx.showModal({
      title: '已提交审核',
      content,
      showCancel: false,
      success: () => wx.navigateBack(),
    });
  },
});
