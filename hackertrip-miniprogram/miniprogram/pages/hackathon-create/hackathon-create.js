const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '发布黑客松',
    aiBanner: false,
    aiIntentText: 'hackathon.create',
    allowed: false,
    submitting: false,
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

  goApply() {
    wx.redirectTo({ url: '/pages/organizer/organizer' });
  },

  async submitHackathon() {
    if (this.data.submitting) return;
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
