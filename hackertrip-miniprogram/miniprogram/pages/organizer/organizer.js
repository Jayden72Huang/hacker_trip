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
    claimSubmitting: false,
    claimEventId: '',
    claimEvent: null,
    claimStatus: 'none',
    claimStatusText: '待提交认领',
    claimStatusHint: '',
    claimActionText: '提交认领申请',
    claimForm: {
      claimRole: '',
      contact: '',
      proofUrl: '',
      note: '',
    },
    claims: [],
    ownedHackathons: [],
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
    const claimEventId = options && options.claim ? decodeURIComponent(options.claim) : '';
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'organizer.apply',
      claimEventId,
    });
    // 从赛事详情「认领」跳转而来：提示用户先完成组织者认证
    if (claimEventId) {
      wx.showToast({ title: '先完成组织者认证，再提交赛事认领', icon: 'none', duration: 2600 });
    }
    this.refresh();
  },

  async refresh() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const app = api.getOrganizerApplication();
    const claims = api.getHackathonClaims().map((claim) => this.decorateClaim(claim));
    const ownedHackathons = api.getOwnedHackathons().map((item) => this.decorateOwnedHackathon(item));
    const claimEventId = this.data.claimEventId;
    let claimEvent = this.data.claimEvent;
    if (claimEventId && (!claimEvent || claimEvent.id !== claimEventId)) {
      claimEvent = await api.getHackathonDetail(claimEventId).catch(() => null);
    }
    const currentClaim = claimEventId ? (api.getHackathonClaim(claimEventId) || null) : null;
    const claimStatus = currentClaim ? currentClaim.status : 'none';
    this.setData({
      status: app.status,
      statusText: this.getStatusText(app.status),
      statusActionText: this.getStatusActionText(app.status),
      statusHint: this.getStatusHint(app.status),
      claimEvent,
      claimStatus,
      claimStatusText: this.getClaimStatusText(claimStatus, app.status),
      claimStatusHint: this.getClaimStatusHint(claimStatus, app.status, currentClaim),
      claimActionText: this.getClaimActionText(claimStatus, app.status),
      claimForm: {
        claimRole: currentClaim && currentClaim.claimRole ? currentClaim.claimRole : (app.role || ''),
        contact: currentClaim && currentClaim.contact ? currentClaim.contact : (app.contact || ''),
        proofUrl: currentClaim && currentClaim.proofUrl ? currentClaim.proofUrl : (claimEvent && claimEvent.website ? claimEvent.website : app.website || ''),
        note: currentClaim && currentClaim.note ? currentClaim.note : '',
      },
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
      claims,
      ownedHackathons,
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

  getClaimStatusText(status, organizerStatus) {
    if (organizerStatus !== 'approved' && status === 'none') {
      if (organizerStatus === 'pending') return '等待组织者认证';
      if (organizerStatus === 'rejected') return '需先修改组织者认证';
      return '需先完成组织者认证';
    }
    const map = {
      none: '待提交认领',
      pending: '赛事认领审核中',
      security_review: '安全复核中',
      approved: '认领已通过',
      rejected: '认领需补充材料',
    };
    return map[status] || '待提交认领';
  },

  getClaimStatusHint(status, organizerStatus, claim) {
    if (organizerStatus === 'pending') {
      return '组织者认证正在审核。通过后回到这里提交赛事归属证明，不需要重新从详情页进入。';
    }
    if (organizerStatus === 'rejected') {
      return '组织者认证未通过，先补充主体资料；通过后才能提交这场赛事的认领申请。';
    }
    if (organizerStatus !== 'approved') {
      return '平台先审核你是否为可信组织者；认证通过后，再审核这场赛事是否归属你。';
    }
    const map = {
      none: '填写你与赛事的关系、联系方式和证明说明。后台审核通过后，这场赛事会绑定到你的组织者账号。',
      pending: '认领申请已提交，后台会核对官网、联系方式和主办方证明。审核通过前暂时不能查看报名用户画像。',
      security_review: '认领材料正在安全复核，通过安全复核后进入人工审核。',
      approved: '赛事已经绑定到你的组织者账号，可以进入现场成员页查看开放身份的用户画像。',
      rejected: (claim && claim.rejectReason) ? `未通过原因：${claim.rejectReason}` : '认领材料不足，请补充官网、联系方式或主办方证明后重新提交。',
    };
    return map[status] || map.none;
  },

  getClaimActionText(status, organizerStatus) {
    if (status === 'approved') return '查看用户画像';
    if (status === 'pending' || status === 'security_review') return '审核中';
    if (organizerStatus !== 'approved') return '等待认证';
    if (status === 'rejected') return '重新提交认领';
    return '提交认领申请';
  },

  decorateClaim(item) {
    const statusMap = {
      pending: '赛事认领审核中',
      security_review: '安全复核中',
      approved: '认领已通过',
      rejected: '需补充材料',
    };
    return Object.assign({}, item, {
      statusText: statusMap[item.status] || '待提交',
    });
  },

  decorateOwnedHackathon(item) {
    return Object.assign({}, item, {
      dateText: [item.startDate, item.endDate].filter(Boolean).join(' - ') || '时间待确认',
      cityText: item.city || item.location || '城市待确认',
    });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onClaimFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`claimForm.${field}`]: e.detail.value });
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

  async submitClaim() {
    if (this.data.claimSubmitting) return;
    const auth = await api.requireAuth(this, '/pages/organizer/organizer' + (this.data.claimEventId ? '?claim=' + this.data.claimEventId : ''), '登录后才能提交赛事认领申请。');
    if (!auth) return;
    if (!api.isOrganizerApproved()) {
      wx.showModal({
        title: this.data.status === 'pending' ? '组织者认证审核中' : '需要组织者认证',
        content: this.data.claimStatusHint || '通过组织者认证后才能提交赛事认领。',
        showCancel: false,
      });
      return;
    }
    const event = this.data.claimEvent;
    if (!event || !event.id) {
      wx.showToast({ title: '缺少赛事信息', icon: 'none' });
      return;
    }
    if (this.data.claimStatus === 'approved') {
      this.goClaimMembers();
      return;
    }
    if (this.data.claimStatus === 'pending' || this.data.claimStatus === 'security_review') {
      wx.showModal({
        title: '赛事认领审核中',
        content: this.data.claimStatusHint,
        showCancel: false,
      });
      return;
    }
    const form = this.data.claimForm;
    if (!form.claimRole.trim() || !form.contact.trim() || !form.note.trim()) {
      wx.showToast({ title: '请填写身份、联系方式和说明', icon: 'none' });
      return;
    }
    this.setData({ claimSubmitting: true });
    const res = await api.submitHackathonClaim(Object.assign({}, form, {
      eventId: event.id,
      eventName: event.name || '',
    }));
    this.setData({ claimSubmitting: false });
    if (!res || !res.ok) {
      const messageMap = {
        CLOUD_REQUIRED: '需要连接云开发后才能提交赛事认领',
        NOT_ORGANIZER: '需先通过组织者认证后再认领赛事',
        EVENT_ALREADY_CLAIMED: '该赛事已被其他组织者认领',
        CONTENT_RISKY: '认领说明未通过安全检测，请修改后重试',
        SECURITY_CHECK_FAILED: '内容安全检测失败，请稍后重试',
      };
      wx.showModal({
        title: '提交失败',
        content: messageMap[res && res.code] || (res && res.message) || '提交赛事认领失败，请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showToast({ title: '认领已提交', icon: 'success' });
    this.refresh();
  },

  goClaimMembers() {
    const event = this.data.claimEvent || {};
    if (!event.id) return;
    wx.navigateTo({ url: '/pages/event-members/event-members?id=' + event.id });
  },

  goOwnedMembers(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/event-members/event-members?id=' + id });
  },

  goOwnedDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },
});
