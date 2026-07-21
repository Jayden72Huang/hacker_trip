const api = require('../../utils/api.js');

Page({
  data: {
    title: '赛事管理',
    isApproved: false,
    ownedHackathons: [],
    drafts: [],
    claims: [],
  },

  onShow() {
    // SWR：本地缓存立即渲染，云端校验放后台
    this.renderLocal();
    this.revalidate();
  },

  renderLocal() {
    this.setData({
      isApproved: api.isOrganizerApproved(),
      ownedHackathons: api.getOwnedHackathons().map((item) => this.decorateOwnedHackathon(item)),
      // 草稿区只放还在流程中的：已发布的会出现在「已上线赛事」，不重复展示
      drafts: api.getHackathonDrafts()
        .filter((draft) => draft.status !== 'approved')
        .map((draft) => Object.assign({}, draft, { statusText: this.getDraftStatusText(draft.status) })),
      claims: api.getHackathonClaims()
        .filter((claim) => claim.status !== 'approved')
        .map((claim) => this.decorateClaim(claim)),
    });
  },

  async revalidate() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    this.renderLocal();
  },

  decorateOwnedHackathon(item) {
    return Object.assign({}, item, {
      dateText: [item.startDate, item.endDate].filter(Boolean).join(' - ') || '时间待确认',
      cityText: item.city || item.location || '城市待确认',
      sourceText: item.claimId ? '认领' : '自主发布',
    });
  },

  decorateClaim(item) {
    const statusMap = {
      pending: '认领审核中',
      security_review: '安全复核中',
      rejected: '需补充材料',
    };
    return Object.assign({}, item, {
      statusText: statusMap[item.status] || '待提交',
    });
  },

  getDraftStatusText(status) {
    const map = {
      pending_review: '待审核',
      pending_manual_review: '平台审核中',
      security_review: '安全复核中',
      security_rejected: '安全检测未通过',
      rejected: '已拒绝',
    };
    return map[status] || '待审核';
  },

  goOwnedDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${encodeURIComponent(id)}` });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/hackathon-create/hackathon-create' });
  },

  goOrganizer() {
    wx.navigateTo({ url: '/pages/organizer/organizer' });
  },
});
