const api = require('../../utils/api.js');

Page({
  data: {
    title: '验证履历',
    submitting: false,
    isApproved: false,
    levelLabel: '获奖',
    form: {
      eventId: '',
      eventName: '',
      targetUid: '',
      title: '',
      level: 'award',
    },
  },

  async onLoad(options) {
    const form = Object.assign({}, this.data.form, {
      eventId: (options && (options.eventId || options.id)) || '',
      eventName: (options && options.eventName) || '',
      targetUid: (options && (options.uid || options.targetUid)) || '',
    });
    this.setData({ form });
    await this.refresh();
  },

  async refresh() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    this.setData({ isApproved: api.isOrganizerApproved() });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onLevelChange(e) {
    const levels = ['participant', 'finalist', 'award', 'mentor', 'judge', 'guest'];
    const value = levels[Number(e.detail.value)] || 'award';
    this.setData({ 'form.level': value, levelLabel: this.levelText(value) });
  },

  levelText(level) {
    const map = {
      participant: '已参赛',
      finalist: '入围',
      award: '获奖',
      mentor: '导师',
      judge: '评委',
      guest: '嘉宾',
    };
    return map[level] || '获奖';
  },

  async submit() {
    if (this.data.submitting) return;
    const auth = await api.requireAuth(this, '/pages/organizer-verify/organizer-verify', '登录并通过组织者认证后才能验证选手履历。');
    if (!auth) return;
    await this.refresh();
    if (!this.data.isApproved) {
      wx.showModal({
        title: '需要组织者认证',
        content: '只有已认证主办方可以给选手写入主办方验证履历。',
        showCancel: false,
      });
      return;
    }
    const form = this.data.form;
    if (!form.eventId.trim() || !form.targetUid.trim() || !form.title.trim()) {
      wx.showToast({ title: '请填写赛事、用户ID和记录标题', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const res = await api.verifyAchievement(form);
    this.setData({ submitting: false });
    if (!res || !res.ok) {
      wx.showModal({
        title: '验证失败',
        content: (res && res.message) || '请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showModal({
      title: '已写入可信履历',
      content: `已为 ${form.targetUid} 写入「${form.title}」记录。`,
      showCancel: false,
    });
  },

  goOrganizer() {
    wx.navigateTo({ url: '/pages/organizer/organizer' });
  },
});
