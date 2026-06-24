const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '组织者认证',
    aiBanner: false,
    aiIntentText: 'organizer.apply',
    status: 'none',
    statusText: '未申请',
    statusActionText: '立即申请',
    form: {
      orgName: '',
      role: '',
      contact: '',
      website: '',
      note: '',
    },
    drafts: [],
  },

  onShow() {
    this.refresh();
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'organizer.apply',
    });
    this.refresh();
  },

  refresh() {
    const app = api.getOrganizerApplication();
    this.setData({
      status: app.status,
      statusText: this.getStatusText(app.status),
      statusActionText: this.getStatusActionText(app.status),
      form: {
        orgName: app.orgName || '',
        role: app.role || '',
        contact: app.contact || '',
        website: app.website || '',
        note: app.note || '',
      },
      drafts: api.getHackathonDrafts(),
    });
  },

  getStatusText(status) {
    const map = {
      none: '未申请',
      pending: '审核中',
      approved: '已认证',
      rejected: '需修改',
    };
    return map[status] || '未申请';
  },

  getStatusActionText(status) {
    const map = {
      none: '立即申请',
      pending: '待审核',
      approved: '已通过',
      rejected: '需修改',
    };
    return map[status] || '立即申请';
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitApplication() {
    const form = this.data.form;
    if (!form.orgName.trim() || !form.role.trim() || !form.contact.trim()) {
      wx.showToast({ title: '请填写机构、身份和联系方式', icon: 'none' });
      return;
    }
    api.saveOrganizerApplication(form);
    wx.showToast({ title: '已提交申请', icon: 'success' });
    this.refresh();
  },

  goCreate() {
    if (!api.isOrganizerApproved()) {
      wx.showModal({
        title: '等待组织者认证',
        content: '审核通过后才能发布黑客松。当前可以先完善申请信息。',
        showCancel: false,
      });
      return;
    }
    wx.navigateTo({ url: '/pages/hackathon-create/hackathon-create' });
  },
});
