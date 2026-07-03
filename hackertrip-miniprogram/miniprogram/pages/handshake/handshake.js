const api = require('../../utils/api.js');

Page({
  data: {
    title: 'AI 破冰',
    eventId: '',
    targetUid: '',
    loading: true,
    error: '',
    target: null,
    report: null,
  },

  async onLoad(options) {
    const eventId = (options && (options.id || options.eventId)) || '';
    const targetUid = (options && (options.uid || options.targetUid)) || '';
    this.setData({ eventId, targetUid });
    await this.load();
  },

  async load() {
    const res = await api.createHandshake(this.data.eventId, this.data.targetUid);
    if (!res || !res.ok) {
      this.setData({
        loading: false,
        error: (res && res.message) || '暂时无法生成破冰报告',
      });
      return;
    }
    this.setData({
      loading: false,
      error: '',
      target: res.target || null,
      report: res.report || null,
    });
  },

  copyOpener() {
    const opener = this.data.report && this.data.report.opener;
    if (!opener) return;
    wx.setClipboardData({
      data: opener,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },
});
