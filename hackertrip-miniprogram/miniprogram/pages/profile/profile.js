const api = require('../../utils/api.js');
const { ROLE_MAP } = require('../../utils/roles.js');

Page({
  data: {
    tab: 'cards', // cards | bookmarks | regs
    cards: [],
    bookmarks: [],
    regs: [],
    scanSynced: false,
    roleMap: ROLE_MAP,
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const cards = api.getCards().map((c) => Object.assign({}, c, {
      roleName: (ROLE_MAP[c.role] || {}).name || c.role,
      emoji: (ROLE_MAP[c.role] || {}).emoji || '🎴',
      techStack: Array.isArray(c.techStack) ? c.techStack : [],
    }));
    // IP 展示卡：取首张身份卡作为角色 hero
    const top = cards.find((c) => c.variant !== 'config') || cards[0] || null;
    const hero = top ? {
      emoji: top.emoji,
      roleName: top.roleName,
      tagline: (ROLE_MAP[top.role] || {}).tagline || '',
      projects: top.projects || 0,
      hackathons: top.hackathons || 0,
      awards: top.awards || 0,
      role: top.role,
      variant: top.variant,
    } : null;
    this.setData({ hero });
    const bookmarks = await api.getBookmarkedHackathons();
    this.setData({
      cards,
      bookmarks,
      regs: api.getRegistrations(),
      scanSynced: !!api.getScanResults(),
    });
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  openCard(e) {
    const c = this.data.cards[e.currentTarget.dataset.idx];
    wx.navigateTo({ url: `/pages/share/share?role=${c.role}&variant=${c.variant}` });
  },
  makeCard() {
    wx.navigateTo({ url: '/pages/card/card' });
  },
  shareHero() {
    const h = this.data.hero;
    if (!h) return;
    wx.navigateTo({ url: `/pages/share/share?role=${h.role}&variant=${h.variant || 'identity'}` });
  },
  openDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.detail.id}` });
  },
  onBookmark(e) {
    api.toggleBookmark(e.detail.id);
    this.refresh();
  },
  goExplore() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  goSync() {
    wx.navigateTo({ url: '/pages/sync/sync' });
  },
  copyWebsite(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) });
  },
});
