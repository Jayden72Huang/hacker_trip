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
    submitting: false,
    form: {
      orgName: '',
      role: '',
      contact: '',
      website: '',
      note: '',
    },
    drafts: [],
    pairCreating: false,
    pairCode: '',
    pairUploadToken: '',
    pairExpireAt: '',
    pairExpireText: '',
    pairCountdown: '',
    pairStatusText: '点击生成一次性配对码，电脑端提交赛事时填写。',
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

  onUnload() {
    this.clearPairTimer();
  },

  async refresh() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
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
      pending: '待审核',
      approved: '已通过',
      rejected: '需修改',
    };
    return map[status] || '立即申请';
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
    const auth = await api.requireAuth(this, '/pages/organizer/organizer', '登录后才能生成赛事提交配对码。');
    if (!auth) return;
    this.setData({ pairCreating: true, pairStatusText: '正在生成提交配对码...' });
    const res = await api.createSyncPair();
    this.setData({ pairCreating: false });
    if (res && res.ok && res.code && res.uploadToken) {
      this.setData({
        pairCode: res.code,
        pairUploadToken: res.uploadToken,
        pairExpireAt: res.expireAt || '',
        pairExpireText: this.formatExpireAt(res.expireAt),
        pairStatusText: '已生成，30 分钟内一次性有效。',
      }, () => this.startPairTimer());
      wx.showToast({ title: '配对码已生成', icon: 'success' });
      return;
    }
    const messageMap = {
      NO_OPENID: '请先登录后再生成配对码',
      CLOUD_REQUIRED: '需要连接云开发后才能生成配对码',
    };
    const message = messageMap[res && res.code] || (res && res.message) || '配对码生成失败，请稍后重试';
    this.setData({ pairStatusText: message });
    wx.showToast({ title: message, icon: 'none' });
  },

  copyPairCode() {
    if (!this.data.pairCode) {
      wx.showToast({ title: '请先生成配对码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.pairCode,
      success: () => wx.showToast({ title: '配对码已复制', icon: 'success' }),
    });
  },

  copyPairToken() {
    if (!this.data.pairUploadToken) {
      wx.showToast({ title: '请先生成凭证', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.pairUploadToken,
      success: () => wx.showToast({ title: '凭证已复制', icon: 'success' }),
    });
  },
});
