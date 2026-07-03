const api = require('../../utils/api.js');

function splitList(text) {
  return String(text || '')
    .split(/[,\n，、\/]/)
    .map((item) => item.trim())
    .filter((item) => item);
}

Page({
  data: {
    title: '组队助手',
    eventId: '',
    goal: '',
    missingRolesText: '',
    result: null,
    loading: false,
  },

  async onLoad(options) {
    const eventId = (options && (options.id || options.eventId)) || '';
    const profile = api.getProfile();
    const pref = profile.teamPreference || {};
    this.setData({
      eventId,
      goal: pref.projectIdea || '',
      missingRolesText: Array.isArray(pref.lookingFor) ? pref.lookingFor.join(', ') : '',
    });
    if (eventId) await this.generate();
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async generate() {
    if (!this.data.eventId) {
      wx.showToast({ title: '请先从活动入口进入', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    const result = await api.recommendTeamMembers(
      this.data.eventId,
      this.data.goal,
      splitList(this.data.missingRolesText),
    );
    this.setData({ loading: false, result });
  },

  openHandshake(e) {
    const uid = e.currentTarget.dataset.uid;
    if (!uid) return;
    wx.navigateTo({ url: `/pages/handshake/handshake?id=${this.data.eventId}&uid=${uid}` });
  },

  goCheckin() {
    if (!this.data.eventId) return;
    wx.navigateTo({ url: '/pages/event-checkin/event-checkin?id=' + this.data.eventId });
  },
});
