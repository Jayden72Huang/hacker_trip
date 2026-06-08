const api = require('../../utils/api.js');

function greet(h) {
  if (h < 6) return '凌晨好';
  if (h < 11) return '早上好';
  if (h < 13) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

Page({
  data: {
    // 自定义导航布局（避让右上胶囊）
    statusBarH: 20,
    navH: 44,
    navTop: 24,
    // 问候
    greeting: '你好',
    userName: '黑客松选手',
    // 三态：idle 静默 / open 展开 / search 搜索
    mode: 'idle',
    keyword: '',
    status: 'all',
    list: [],
    bookmarks: [],
    loading: true,
    drawerOpen: false,
    hasScan: false,
    // 最近/热门搜索建议
    recents: ['AI Agent', '出海', '硬件', '深圳'],
    hots: ['大模型应用', 'Web3', '创作工具'],
  },

  onLoad() {
    let sb = 20, navTop = 24, navH = 44;
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      sb = win.statusBarHeight || 20;
      const m = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      if (m && m.top) { navTop = m.top; navH = m.height; }
      else { navTop = sb + 6; navH = 32; }
    } catch (e) {}
    const name = (function () { try { return wx.getStorageSync('ht_user_name') || '黑客松选手'; } catch (e) { return '黑客松选手'; } })();
    let hour = 20;
    try { hour = new Date().getHours(); } catch (e) {}
    this.setData({ statusBarH: sb, navTop, navH, greeting: greet(hour), userName: name });
    this.refresh();
  },

  onShow() {
    this.setData({ bookmarks: api.getBookmarks(), hasScan: !!api.getScanResults() });
  },

  async refresh() {
    this.setData({ loading: true });
    const list = await api.getHackathons({ q: this.data.keyword, status: this.data.status });
    this.setData({ list, bookmarks: api.getBookmarks(), loading: false });
  },

  /* ---------- 三态切换 ---------- */
  // 第 1 下：静默 → 展开
  expand() {
    if (this.data.mode === 'idle') this.setData({ mode: 'open' });
    else if (this.data.mode === 'open') this.focusSearch();
  },
  // 第 2 下：展开 → 搜索（聚焦输入）
  focusSearch() {
    this.setData({ mode: 'search', searchFocus: true });
  },
  collapse() {
    this.setData({ mode: 'idle', keyword: '', searchFocus: false }, () => this.refresh());
  },
  backToOpen() {
    this.setData({ mode: 'open', searchFocus: false });
  },

  onInput(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() { this.setData({ mode: 'open' }, () => this.refresh()); },
  onClearKeyword() { this.setData({ keyword: '' }, () => this.refresh()); },
  pickSuggest(e) {
    this.setData({ keyword: e.currentTarget.dataset.k, mode: 'open' }, () => this.refresh());
  },
  onStatusTab(e) {
    this.setData({ status: e.currentTarget.dataset.key }, () => this.refresh());
  },

  /* ---------- 列表 ---------- */
  onCardTap(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.detail.id}` }); },
  onBookmark(e) { api.toggleBookmark(e.detail.id); this.setData({ bookmarks: api.getBookmarks() }); },

  /* ---------- 抽屉 ---------- */
  openDrawer() { this.setData({ drawerOpen: true }); },
  closeDrawer() { this.setData({ drawerOpen: false }); },
  noop() {},
  goCard() { this.closeDrawer(); wx.navigateTo({ url: '/pages/card/card' }); },
  goSync() { this.closeDrawer(); wx.navigateTo({ url: '/pages/sync/sync' }); },
  goProfile() { this.closeDrawer(); wx.navigateTo({ url: '/pages/profile/profile' }); },
  goRecent() { this.closeDrawer(); wx.navigateTo({ url: '/pages/recent/recent' }); },
  goResult() { this.closeDrawer(); wx.navigateTo({ url: '/pages/result/result' }); },

  onShareAppMessage() {
    return { title: 'HackerTrip · 你的一站式黑客松平台', path: '/pages/index/index' };
  },
});
