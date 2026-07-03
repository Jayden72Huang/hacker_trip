const api = require('../../utils/api.js');

Page({
  data: {
    title: '报名助手',
    formText: '',
    result: null,
  },

  onShow() {
    if (api.isLoggedIn()) api.syncUserDataIfLoggedIn().catch(() => {});
  },

  onInput(e) {
    this.setData({ formText: e.detail.value });
  },

  generate() {
    const result = api.generateRegistrationDraft(this.data.formText);
    this.setData({ result });
  },

  copyAll() {
    const result = this.data.result;
    if (!result || !Array.isArray(result.sections)) return;
    const text = result.sections
      .map((item) => `【${item.title}】\n${item.content}`)
      .join('\n\n');
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '草稿已复制', icon: 'success' }),
    });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/identity-edit/identity-edit' });
  },
});
