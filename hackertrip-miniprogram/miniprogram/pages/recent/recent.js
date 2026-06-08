const api = require('../../utils/api.js');

Page({
  data: {
    msgs: [
      { icon: '🤝', bg: '#efe7df', fg: '#c96442', kind: 'team', title: '@Alex 邀请你加入「春潮」战队', sub: '前端+设计已就位，想找一名后端', time: '2 分钟', link: '' },
      { icon: '📡', bg: '#e7efe8', fg: '#3f9c6a', kind: 'sub', title: '深圳新增 3 场线下黑客松', sub: '你订阅的「深圳·线下」有更新', time: '1 小时', link: 'ht-00' },
      { icon: '✳', bg: '#f4ede4', fg: '#c96442', kind: 'product', title: 'HackerTrip 上线身份卡裂变', sub: '生成你的选手身份卡，分享找队友', time: '昨天', link: '' },
      { icon: '🏆', bg: '#e9e7f2', fg: '#6a5fc0', kind: 'sub', title: 'AdventureX 报名截止前 3 天', sub: '你收藏的比赛，7 月 12 日截止', time: '昨天', link: 'ht-01' },
    ],
  },

  onTap(e) {
    const m = this.data.msgs[e.currentTarget.dataset.idx];
    if (m.kind === 'product') { wx.navigateTo({ url: '/pages/card/card' }); return; }
    if (m.link) { wx.navigateTo({ url: `/pages/detail/detail?id=${m.link}` }); return; }
    wx.showToast({ title: '已读', icon: 'none' });
  },
});
