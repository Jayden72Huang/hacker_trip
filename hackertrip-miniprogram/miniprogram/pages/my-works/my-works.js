const api = require('../../utils/api.js');

const STATUS_TEXT = {
  pending: '待审核',
  published: '已发布',
  rejected: '已下架',
};

const STATUS_CLASS = {
  pending: 'status-pending',
  published: 'status-published',
  rejected: 'status-rejected',
};

const PRIMARY_ACTION = {
  pending: { action: 'approve', text: '发布' },
  published: { action: 'reject', text: '下架' },
  rejected: { action: 'approve', text: '重新发布' },
};

function normalizeWork(work) {
  const status = STATUS_TEXT[work.status] ? work.status : 'pending';
  const primary = PRIMARY_ACTION[status];
  return Object.assign({}, work, {
    status,
    statusText: STATUS_TEXT[status],
    statusClass: STATUS_CLASS[status],
    primaryAction: primary.action,
    primaryActionText: primary.text,
    techStack: Array.isArray(work.techStack) ? work.techStack : [],
  });
}

Page({
  data: {
    title: '我的作品',
    loading: false,
    error: '',
    works: [],
  },

  onLoad() {
    this.loadWorks();
  },

  onShow() {
    if (!this.data.loading) this.loadWorks();
  },

  async loadWorks() {
    const auth = await api.requireAuth(this, '/pages/my-works/my-works', '登录后才能查看和管理自己的作品。');
    if (!auth) {
      this.setData({ loading: false, works: [], error: '请先登录后再管理作品。' });
      return;
    }
    this.setData({ loading: true, error: '' });
    const res = await api.listReviewWorks();
    this.setData({ loading: false });
    if (res && res.ok) {
      this.setData({ works: (res.works || []).map(normalizeWork), error: '' });
      return;
    }
    this.handleError(res, '作品列表加载失败');
  },

  handleError(res, fallback) {
    const code = res && res.code;
    const map = {
      NO_OPENID: '请先登录后再操作作品',
      FORBIDDEN: '当前账号无权操作该作品',
      WORK_NOT_FOUND: '作品不存在或已被删除',
      INVALID_WORK: '作品数据不完整，暂时不能发布',
      CLOUD_REQUIRED: '需要连接云开发后才能管理作品',
    };
    const message = map[code] || (res && res.message) || fallback || '操作失败';
    this.setData({ error: message });
    wx.showToast({ title: message, icon: 'none' });
  },

  async runAction(e) {
    const workId = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;
    if (!workId || !action || this.data.loading) return;

    const actionText = action === 'delete' ? '删除' : (action === 'reject' ? '下架' : '发布');
    if (action === 'delete') {
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '删除作品',
          content: '删除后不可恢复，确定继续吗？',
          confirmText: '删除',
          confirmColor: '#FF4D2E',
          success: (res) => resolve(!!res.confirm),
          fail: () => resolve(false),
        });
      });
      if (!confirmed) return;
    }

    this.setData({ loading: true, error: '' });
    const res = await api.updateReviewWork(action, workId);
    if (res && res.ok) {
      wx.showToast({ title: `${actionText}成功`, icon: 'success' });
      await this.loadWorks();
      return;
    }
    this.setData({ loading: false });
    this.handleError(res, `${actionText}失败`);
  },

  onAuthLogin() {
    this.loadWorks();
  },
});
