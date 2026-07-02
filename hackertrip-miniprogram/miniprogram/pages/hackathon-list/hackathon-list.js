const api = require('../../utils/api.js');
const { buildCityOptions, matchHackathonCity, matchHackathonQuery } = require('../../utils/hackathon-search.js');
const { SORT_OPTIONS, decorateCardItem, sortCardItems, getSortLabel } = require('../../utils/hackathon-card-data.js');
const share = require('../../utils/share.js');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '线上' },
  { key: 'offline', label: '线下' },
  { key: 'AI', label: 'AI' },
  { key: 'Web3', label: 'Web3' },
];

function matchFilter(item, filter) {
  if (filter === 'all') return true;
  if (filter === item.mode) return true;
  const text = [
    item.theme,
    ...(item.tracks || []),
    ...(item.techStack || []),
    ...(item.tags || []),
  ].join(' ');
  return text.toLowerCase().includes(filter.toLowerCase());
}

Page({
  data: {
    title: '全部黑客松',
    city: '全国',
    cities: ['全国'],
    cityPickerVisible: false,
    query: '',
    activeFilter: 'all',
    filters: FILTERS,
    sortKey: 'heat',
    sortLabel: '热度优先',
    sortOptions: SORT_OPTIONS,
    sortPickerVisible: false,
    hackathons: [],
    filteredCount: 0,
    scopeCount: 0,
    totalCount: 0,
    loading: true,
  },

  allEvents: [],

  async onLoad(options) {
    share.enableShareMenu();
    const initialCity = options && options.city ? decodeURIComponent(options.city) : '全国';
    const initialQuery = options && options.q ? decodeURIComponent(options.q) : '';
    const initialFilter = options && options.filter ? decodeURIComponent(options.filter) : 'all';
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    let all = [];
    try {
      all = await api.getHackathons();
    } catch (err) {
      all = [];
    }
    this.allEvents = all;
    const cities = buildCityOptions(all);
    const city = cities.indexOf(initialCity) !== -1 ? initialCity : '全国';
    const activeFilter = FILTERS.find((item) => item.key === initialFilter) ? initialFilter : 'all';
    this.setData({
      city,
      cities,
      query: initialQuery,
      activeFilter,
      totalCount: all.length,
      loading: false,
    });
    this.applyFilters(all);
  },

  async onShow() {
    if (this.allEvents.length) {
      if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
      this.applyFilters();
    }
  },

  openCityPicker() {
    this.setData({ cityPickerVisible: true });
  },
  closeCityPicker() {
    this.setData({ cityPickerVisible: false });
  },
  openSortPicker() {
    this.setData({ sortPickerVisible: true });
  },
  closeSortPicker() {
    this.setData({ sortPickerVisible: false });
  },
  onSortPick(e) {
    const sortKey = e.currentTarget.dataset.key || 'heat';
    this.setData({
      sortKey,
      sortLabel: getSortLabel(sortKey),
      sortPickerVisible: false,
    });
    this.applyFilters();
  },
  onCityPick(e) {
    const city = e.currentTarget.dataset.city || '全国';
    this.setData({ city, cityPickerVisible: false });
    this.applyFilters();
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value || '' });
    this.applyFilters();
  },

  onSearchConfirm() {
    this.applyFilters();
  },

  clearSearch() {
    this.setData({ query: '' });
    this.applyFilters();
  },

  onFilterTap(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key || 'all' });
    this.applyFilters();
  },

  applyFilters(source) {
    const all = source || this.allEvents;
    const query = this.data.query.trim();
    const activeFilter = this.data.activeFilter;
    const city = this.data.city;
    const cityEvents = all.filter((item) => matchHackathonCity(item, city));

    const hackathons = cityEvents.filter((item) => {
      return matchFilter(item, activeFilter) && matchHackathonQuery(item, query);
    });

    const marked = sortCardItems(hackathons.map(decorateCardItem), this.data.sortKey);

    this.setData({
      hackathons: marked,
      filteredCount: marked.length,
      scopeCount: cityEvents.length,
    });
  },

  async onBookmark(e) {
    const auth = await api.requireAuth(this, '/pages/hackathon-list/hackathon-list', '登录后才能订阅赛事，并在你的账号中同步查看。');
    if (!auth) return;
    const id = e.detail.id;
    if (!id) return;
    const active = await api.toggleBookmark(id);
    this.applyFilters();
    wx.showToast({ title: active ? '已订阅' : '已取消订阅', icon: 'none' });
  },

  onRegister(e) {
    const id = e.detail && e.detail.id;
    const item = this.data.hackathons.find((entry) => entry.id === id) || {};
    const url = e.detail.url || item.registerUrl || item.website || '';
    if (!url) {
      wx.showToast({ title: '暂无报名链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '已经复制报名链接,请到浏览器打开报名', icon: 'none' });
      },
    });
  },

  goDetail(e) {
    const id = (e.detail && e.detail.id) || (e.currentTarget && e.currentTarget.dataset.id);
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  buildSharePayload() {
    return share.buildListShare({
      city: this.data.city,
      q: this.data.query.trim(),
      filter: this.data.activeFilter,
    });
  },

  onShareAppMessage() {
    return this.buildSharePayload();
  },

  onShareTimeline() {
    return share.timelinePayload(this.buildSharePayload());
  },
});
