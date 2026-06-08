const api = require('../../utils/api.js');

Page({
  data: {
    scan: null,
  },

  onLoad() {
    const scan = api.getScanResults();
    // 数据不完整（无匹配项）时按空态处理，引导重新同步
    this.setData({ scan: scan && scan.matches && scan.matches.length ? scan : null });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '该比赛暂无详情', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  makeCard() {
    wx.navigateTo({ url: '/pages/card/card' });
  },

  goSync() {
    wx.navigateTo({ url: '/pages/sync/sync' });
  },

  onShareAppMessage() {
    return {
      title: '我用 HackerTrip 扫描代码匹配到了这些黑客松',
      path: '/pages/index/index',
    };
  },
});
