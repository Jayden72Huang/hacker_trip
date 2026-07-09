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

const EMPTY_FORM = { name: '', summary: '', awards: '', repo: '', demo: '', techText: '', cover: '' };

Page({
  data: {
    title: '我的作品',
    loading: false,
    error: '',
    works: [],
    formOpen: false,
    editingId: '',
    form: Object.assign({}, EMPTY_FORM),
    saving: false,
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

  /* ---------------- 手动添加 / 编辑作品 ---------------- */

  openCreateForm() {
    this.setData({ formOpen: true, editingId: '', form: Object.assign({}, EMPTY_FORM) });
  },

  openEditForm(e) {
    const work = this.data.works.find((item) => item._id === e.currentTarget.dataset.id);
    if (!work) return;
    this.setData({
      formOpen: true,
      editingId: work._id,
      form: {
        name: work.name || '',
        summary: work.summary || '',
        awards: work.awards || '',
        repo: work.repo || '',
        demo: work.demo || '',
        techText: (work.techStack || []).join('、'),
        cover: work.cover || '',
      },
    });
  },

  closeForm() {
    this.setData({ formOpen: false, editingId: '' });
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 选产品 logo/封面：选图即上传云存储，表单里预览 fileID
  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const filePath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!filePath) return;
        wx.showLoading({ title: '上传中…', mask: true });
        const fileID = await api.uploadWorkCover(filePath);
        wx.hideLoading();
        if (!fileID) {
          wx.showToast({ title: '上传失败，请连接云环境后重试', icon: 'none' });
          return;
        }
        this.setData({ 'form.cover': fileID });
      },
    });
  },

  removeCover() {
    this.setData({ 'form.cover': '' });
  },

  async submitForm() {
    if (this.data.saving) return;
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '先填一个作品名称', icon: 'none' });
      return;
    }
    const auth = await api.requireAuth(this, '/pages/my-works/my-works', '登录后才能添加作品。');
    if (!auth) return;

    this.setData({ saving: true });
    const res = await api.saveWork({
      name: form.name,
      summary: form.summary,
      awards: form.awards,
      repo: form.repo,
      demo: form.demo,
      cover: form.cover,
      techStack: form.techText.split(/[，、,\s]+/).map((s) => s.trim()).filter(Boolean),
    }, this.data.editingId);
    this.setData({ saving: false });

    if (res && res.ok) {
      wx.showToast({ title: this.data.editingId ? '已保存' : '已添加，点「发布」后对外可见', icon: 'none' });
      this.setData({ formOpen: false, editingId: '' });
      await this.loadWorks();
      return;
    }
    const map = {
      INVALID_WORK: '作品名称必填',
      INVALID_LINK: '链接需以 http:// 或 https:// 开头',
      RISKY_CONTENT: '内容含违规信息，请修改后再提交',
      RISKY_IMAGE: '图片含违规内容，请更换后再提交',
    };
    const message = map[res && res.code] || (res && res.message) || '保存失败，请重试';
    wx.showToast({ title: message, icon: 'none' });
  },
});
