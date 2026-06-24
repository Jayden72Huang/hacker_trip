const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '发布黑客松',
    aiBanner: false,
    aiIntentText: 'hackathon.create',
    allowed: false,
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
    const allowed = api.isOrganizerApproved();
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'hackathon.create',
      allowed,
    });
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

  submitHackathon() {
    if (!api.isOrganizerApproved()) {
      this.setData({ allowed: false });
      wx.showToast({ title: '需先通过组织者认证', icon: 'none' });
      return;
    }
    const form = this.data.form;
    if (!form.name.trim() || !form.city.trim() || !form.startDate.trim() || !form.endDate.trim() || !form.website.trim()) {
      wx.showToast({ title: '请补全名称、城市、时间和官网', icon: 'none' });
      return;
    }
    api.saveHackathonDraft(form);
    wx.showModal({
      title: '已提交审核',
      content: '赛事已保存为待审核草稿。审核通过后会进入 HackerTrip 赛事库。',
      showCancel: false,
      success: () => wx.navigateBack(),
    });
  },
});
