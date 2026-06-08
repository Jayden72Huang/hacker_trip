const api = require('../../utils/api.js');

Page({
  data: {
    item: null,
    loading: true,
    bookmarked: false,
    registered: false,
    modeLabel: { online: '线上', offline: '线下', hybrid: '线上 + 线下' },
  },

  async onLoad(query) {
    const id = query.id;
    const item = await api.getHackathonDetail(id);
    const regs = api.getRegistrations();
    this.setData({
      item,
      loading: false,
      bookmarked: api.isBookmarked(id),
      registered: !!regs.find((r) => r.id === id),
    });
    if (item) wx.setNavigationBarTitle({ title: item.shortName || item.name });
  },

  toggleBookmark() {
    const active = api.toggleBookmark(this.data.item.id);
    this.setData({ bookmarked: active });
    wx.showToast({ title: active ? '已收藏' : '已取消', icon: 'none' });
  },

  register() {
    const it = this.data.item;
    api.addRegistration({
      id: it.id,
      name: it.name,
      startDate: it.startDate,
      city: it.city,
      website: it.website,
    });
    this.setData({ registered: true });
    wx.showToast({ title: '已加入报名清单', icon: 'success' });
  },

  copyWebsite() {
    if (!this.data.item.website) return;
    wx.setClipboardData({
      data: this.data.item.website,
      success: () => wx.showToast({ title: '官网链接已复制', icon: 'none' }),
    });
  },

  goMakeCard() {
    wx.navigateTo({ url: '/pages/card/card' });
  },

  onShareAppMessage() {
    const it = this.data.item || {};
    return {
      title: `${it.name} · 来 HackerTrip 看看这场黑客松`,
      path: `/pages/detail/detail?id=${it.id}`,
    };
  },
});
