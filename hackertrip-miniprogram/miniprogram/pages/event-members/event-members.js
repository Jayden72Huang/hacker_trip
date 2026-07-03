const api = require('../../utils/api.js');

Page({
  data: {
    title: '现场成员',
    eventId: '',
    event: null,
    members: [],
    loading: true,
  },

  async onLoad(options) {
    this.setData({ eventId: (options && (options.id || options.eventId)) || '' });
    await this.load();
  },

  async onPullDownRefresh() {
    await this.load();
    wx.stopPullDownRefresh();
  },

  async load() {
    const eventId = this.data.eventId;
    if (!eventId) {
      this.setData({ loading: false });
      return;
    }
    const res = await api.listEventMembers(eventId);
    const members = res && Array.isArray(res.members) ? res.members : [];
    this.setData({
      loading: false,
      event: res && res.event ? res.event : null,
      members: members.map((item) => Object.assign({}, item, {
        avatarChar: (item.displayName || 'H').trim().charAt(0).toUpperCase() || 'H',
        lookingForText: Array.isArray(item.lookingFor) ? item.lookingFor.join(' / ') : '',
      })),
    });
  },

  openHandshake(e) {
    const uid = e.currentTarget.dataset.uid;
    if (!uid) return;
    wx.navigateTo({ url: `/pages/handshake/handshake?id=${this.data.eventId}&uid=${uid}` });
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/event-checkin/event-checkin?id=' + this.data.eventId });
  },
});
