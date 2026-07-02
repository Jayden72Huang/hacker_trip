const api = require('../../utils/api.js');

Page({
  data: {
    title: '审核工作台',
    loading: true,
    isAdmin: false,
    error: '',
    activeTab: 'drafts',
    drafts: [],
    organizers: [],
    hackathons: [],
    rejectTargetId: '',
    rejectTargetType: '',
    rejectReason: '',
    notifyingId: '',
  },

  onLoad() {
    this.load();
  },

  async load() {
    this.setData({ loading: true, error: '' });
    const res = await api.adminHackathonManage('list', {});
    if (!res || !res.ok) {
      this.setData({
        loading: false,
        isAdmin: false,
        error: (res && res.message) || '无法读取赛事管理数据',
        drafts: [],
        organizers: [],
        hackathons: [],
      });
      return;
    }

    this.setData({
      loading: false,
      isAdmin: true,
      drafts: (res.drafts || []).map((item) => this.decorateDraft(item)),
      organizers: (res.organizers || []).map((item) => this.decorateOrganizer(item)),
      hackathons: (res.hackathons || []).map((item) => this.decorateHackathon(item)),
    });
  },

  decorateDraft(item) {
    const statusMap = {
      pending_review: '待审核',
      pending_manual_review: '人工审核',
      security_review: '安全复核',
    };
    let tracksList = [];
    if (Array.isArray(item.tracks)) {
      tracksList = item.tracks.map((t) => (t && typeof t === 'object' && t.title) ? t.title : String(t));
    }
    let organizerName = item.organizerName || '';
    if (!organizerName && Array.isArray(item.organizers)) {
      organizerName = item.organizers.map((o) => (o && typeof o === 'object' ? o.name : o) || '').filter(Boolean).join(' / ');
    }
    return Object.assign({}, item, {
      statusText: statusMap[item.status] || item.status || '待审核',
      tracksText: tracksList.join(' / ') || '',
      organizerName: organizerName,
    });
  },

  decorateHackathon(item) {
    const modeMap = { offline: '线下', online: '线上', hybrid: '混合' };
    let organizerName = item.organizerName || '';
    if (!organizerName && Array.isArray(item.organizers)) {
      organizerName = item.organizers.map((o) => (o && typeof o === 'object' ? o.name : o) || '').filter(Boolean).join(' / ');
    }
    return Object.assign({}, item, {
      publishedText: item.isPublished === false ? '已下线' : '已上线',
      modeText: item.modeText || modeMap[item.mode] || item.mode || '未设置',
      tracksText: Array.isArray(item.tracks) ? item.tracks.join(' / ') : (item.tracks || ''),
      organizerName: organizerName,
    });
  },

  decorateOrganizer(item) {
    const statusMap = {
      pending: '待审核',
      security_review: '安全复核',
    };
    return Object.assign({}, item, {
      statusText: statusMap[item.status] || item.status || '待审核',
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab || 'drafts' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  approveDraft(e) {
    const draftId = e.currentTarget.dataset.id;
    if (!draftId) return;
    wx.showModal({
      title: '发布赛事',
      content: '确认人工审核通过，并发布到正式赛事列表？',
      confirmText: '发布',
      success: async (res) => {
        if (!res.confirm) return;
        await this.runAction('approveDraft', { draftId }, '已发布');
      },
    });
  },

  openReject(e) {
    this.setData({
      rejectTargetId: e.currentTarget.dataset.id || '',
      rejectTargetType: e.currentTarget.dataset.type || 'draft',
      rejectReason: '',
    });
  },

  closeReject() {
    this.setData({ rejectTargetId: '', rejectTargetType: '', rejectReason: '' });
  },

  onRejectReason(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  async confirmReject() {
    const targetId = this.data.rejectTargetId;
    if (!targetId) return;
    if (this.data.rejectTargetType === 'organizer') {
      await this.runAction('rejectOrganizer', {
        applicationId: targetId,
        reason: this.data.rejectReason || '组织者信息需要补充或未通过人工审核',
      }, '已拒绝');
    } else {
      await this.runAction('rejectDraft', {
        draftId: targetId,
        reason: this.data.rejectReason || '信息需要补充或未通过人工审核',
      }, '已拒绝');
    }
    this.closeReject();
  },

  approveOrganizer(e) {
    const applicationId = e.currentTarget.dataset.id;
    if (!applicationId) return;
    wx.showModal({
      title: '通过组织者',
      content: '确认该申请方通过组织者认证？通过后可以提交黑客松赛事草稿。',
      confirmText: '通过',
      success: async (res) => {
        if (!res.confirm) return;
        await this.runAction('approveOrganizer', { applicationId }, '已通过');
      },
    });
  },

  togglePublished(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.hackathons[index];
    if (!item) return;
    const next = item.isPublished === false;
    wx.showModal({
      title: next ? '上线赛事' : '下线赛事',
      content: next ? '上线后用户可在发现页看到该赛事。' : '下线后普通用户将看不到该赛事。',
      confirmText: next ? '上线' : '下线',
      success: async (res) => {
        if (!res.confirm) return;
        await this.runAction('setPublished', {
          docId: item._id,
          id: item.id,
          isPublished: next,
        }, next ? '已上线' : '已下线');
      },
    });
  },

  notifyHackathon(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.hackathons[index];
    if (!item || !item.id) return;
    wx.showModal({
      title: '发送赛事通知',
      content: `确认给订阅过黑客松上新提醒的用户发送「${item.shortName || item.name}」通知？`,
      confirmText: '发送',
      success: async (res) => {
        if (!res.confirm) return;
        await this.runNotify(item);
      },
    });
  },

  async runNotify(item) {
    const id = item.id || item._id || '';
    this.setData({ notifyingId: id });
    wx.showLoading({ title: '发送中' });
    const res = await api.sendHackathonNotifications({
      action: 'send',
      type: api.SUBSCRIBE_TYPES.NEW_HACKATHON,
      hackathonId: item.id,
      hackathon: item,
      title: item.shortName || item.name,
      note: item.city ? `${item.city} · 查看详情` : '打开 HackerTrip 查看详情',
    });
    wx.hideLoading();
    this.setData({ notifyingId: '' });
    if (!res || !res.ok) {
      const messageMap = {
        TEMPLATE_NOT_CONFIGURED: '订阅消息模板 ID 还没有配置，暂时无法发送。',
        FORBIDDEN: '当前账号没有发送订阅消息权限。',
      };
      wx.showModal({
        title: '通知失败',
        content: messageMap[res && res.code] || (res && res.message) || '请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showModal({
      title: '通知完成',
      content: `订阅用户 ${res.count || 0} 人，成功 ${res.sent || 0}，失败 ${res.failed || 0}。`,
      showCancel: false,
    });
  },

  async runAction(action, payload, successTitle) {
    wx.showLoading({ title: '处理中' });
    const res = await api.adminHackathonManage(action, payload);
    wx.hideLoading();
    if (!res || !res.ok) {
      wx.showModal({
        title: '操作失败',
        content: (res && res.message) || '请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showToast({ title: successTitle || '已完成', icon: 'success' });
    this.load();
  },
});
