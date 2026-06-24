const api = require('../../utils/api.js');
const { buildCityOptions, matchHackathonCity, matchHackathonQuery } = require('../../utils/hackathon-search.js');

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
    hackathons: [],
    filteredCount: 0,
    scopeCount: 0,
    totalCount: 0,
    loading: true,
  },

  allEvents: [],

  async onLoad(options) {
    const initialCity = options && options.city ? decodeURIComponent(options.city) : '全国';
    const initialQuery = options && options.q ? decodeURIComponent(options.q) : '';
    const initialFilter = options && options.filter ? decodeURIComponent(options.filter) : 'all';
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

  onShow() {
    if (this.allEvents.length) this.applyFilters();
  },

  openCityPicker() {
    this.setData({ cityPickerVisible: true });
  },
  closeCityPicker() {
    this.setData({ cityPickerVisible: false });
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

    const marked = hackathons.map((item) => Object.assign({}, item, {
      bookmarked: api.isBookmarked(item.id),
    }));

    this.setData({
      hackathons: marked,
      filteredCount: marked.length,
      scopeCount: cityEvents.length,
    });
  },

  onBookmark(e) {
    if (!api.requireAuth('/pages/hackathon-list/hackathon-list')) return;
    const id = e.detail.id;
    if (!id) return;
    const active = api.toggleBookmark(id);
    const hackathons = this.data.hackathons.map((item) =>
      item.id === id ? Object.assign({}, item, { bookmarked: active }) : item,
    );
    this.setData({ hackathons });
    wx.showToast({ title: active ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  goDetail(e) {
    const id = (e.detail && e.detail.id) || (e.currentTarget && e.currentTarget.dataset.id);
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
});
