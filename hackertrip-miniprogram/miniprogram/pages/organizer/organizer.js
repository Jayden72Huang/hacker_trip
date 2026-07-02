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
    statusHint: '填写下方申请信息，提交后进入平台审核。',
    submitting: false,
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
    // 从赛事详情「认领」跳转而来：提示用户先完成组织者认证
    if (options && options.claim) {
      wx.showToast({ title: '先完成组织者认证即可认领', icon: 'none', duration: 2400 });
    }
    this.refresh();
  },

  async refresh() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const app = api.getOrganizerApplication();
    this.setData({
      status: app.status,
      statusText: this.getStatusText(app.status),
      statusActionText: this.getStatusActionText(app.status),
      statusHint: this.getStatusHint(app.status),
      form: {
        orgName: app.orgName || '',
        role: app.role || '',
        contact: app.contact || '',
        website: app.website || '',
        note: app.note || '',
      },
      drafts: api.getHackathonDrafts().map((draft) => Object.assign({}, draft, {
        statusText: this.getDraftStatusText(draft.status),
      })),
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
      pending: '查看进度',
      approved: '发布赛事',
      rejected: '需修改',
    };
    return map[status] || '立即申请';
  },

  getStatusHint(status) {
    const map = {
      none: '填写下方申请信息，提交后进入平台审核。',
      pending: '我们会核对机构身份和活动真实性，审核通过后开放赛事发布。',
      approved: '认证已通过，现在可以发布黑客松；提交后的赛事仍会进入内容审核。',
      rejected: '申请未通过，请根据反馈修改资料后重新提交。',
    };
    return map[status] || map.none;
  },

  getDraftStatusText(status) {
    const map = {
      pending_review: '待审核',
      pending_manual_review: '平台审核中',
      security_review: '安全复核中',
      security_rejected: '安全检测未通过',
      approved: '已发布',
      rejected: '已拒绝',
    };
    return map[status] || '待审核';
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async submitApplication() {
    if (this.data.submitting) return;
    const auth = await api.requireAuth(this, '/pages/organizer/organizer', '登录后才能提交组织者认证申请。');
    if (!auth) return;
    const form = this.data.form;
    if (!form.orgName.trim() || !form.role.trim() || !form.contact.trim()) {
      wx.showToast({ title: '请填写机构、身份和联系方式', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const res = await api.submitOrganizerApplication(form);
    this.setData({ submitting: false });
    if (!res || !res.ok) {
      const messageMap = {
        CLOUD_REQUIRED: '需要连接云开发后才能提交组织者申请',
        CONTENT_RISKY: '申请内容未通过安全检测，请修改后重试',
        SECURITY_CHECK_FAILED: '内容安全检测失败，请稍后重试',
      };
      wx.showModal({
        title: '提交失败',
        content: messageMap[res && res.code] || (res && res.message) || '提交组织者申请失败，请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showToast({ title: '已提交申请', icon: 'success' });
    this.refresh();
  },

  onAuthLogin() {
    this.refresh();
  },

  onStatusAction() {
    if (this.data.status === 'approved') {
      this.goCreate();
      return;
    }
    if (this.data.status === 'pending') {
      wx.showModal({
        title: '申请审核中',
        content: this.data.statusHint,
        showCancel: false,
      });
      return;
    }
    if (this.data.status === 'none' || this.data.status === 'rejected') {
      wx.pageScrollTo({
        selector: '#organizer-form',
        duration: 240,
        fail: () => wx.showToast({ title: '请填写下方申请信息', icon: 'none' }),
      });
    }
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
