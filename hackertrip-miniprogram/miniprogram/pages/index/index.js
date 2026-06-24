const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
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

function compactDateRange(startDate, endDate) {
  if (!startDate) return '待确认';
  if (!endDate || endDate === startDate) return startDate;
  if (startDate.slice(0, 4) === endDate.slice(0, 4)) {
    return `${startDate} - ${endDate.slice(5)}`;
  }
  return `${startDate} - ${endDate}`;
}

function decorateFeatured(list) {
  return list.slice(0, 4).map((item) => Object.assign({}, item, {
    featuredDateText: compactDateRange(item.startDate, item.endDate),
  }));
}

Page({
  data: {
    title: '发现黑客松',
    aiBanner: false,
    aiIntentText: '继续任务',
    city: '全国',
    cities: ['全国'],
    cityPickerVisible: false,
    query: '',
    activeFilter: 'all',
    filters: FILTERS,
    featured: [],
    hackathons: [],
    filteredCount: 0,
    totalCount: 0,
    loading: true,
  },

  // 云端拉取的全量赛事，applyFilters 基于此做内存过滤
  allEvents: [],

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 从详情等页返回时同步收藏态（用已缓存的 allEvents，不重复请求云端）
    if (this.allEvents.length) this.applyFilters();
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '发现黑客松',
    });

    let all = [];
    try {
      all = await api.getHackathons();
    } catch (err) {
      all = [];
    }
    this.allEvents = all;
    const cities = buildCityOptions(all);

    this.setData({
      cities,
      featured: decorateFeatured(all),
      totalCount: all.length,
      loading: false,
    });
    this.applyFilters(all);
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
    this.goMore();
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

    // 标记收藏态供卡片高亮
    const marked = hackathons.map((item) => Object.assign({}, item, {
      bookmarked: api.isBookmarked(item.id),
    }));

    this.setData({
      featured: decorateFeatured(cityEvents),
      hackathons: marked.slice(0, 4),
      filteredCount: marked.length,
    });
  },

  goMore() {
    const params = [];
    if (this.data.city && this.data.city !== '全国') {
      params.push(`city=${encodeURIComponent(this.data.city)}`);
    }
    if (this.data.query.trim()) {
      params.push(`q=${encodeURIComponent(this.data.query.trim())}`);
    }
    if (this.data.activeFilter && this.data.activeFilter !== 'all') {
      params.push(`filter=${encodeURIComponent(this.data.activeFilter)}`);
    }
    wx.navigateTo({ url: `/pages/hackathon-list/hackathon-list${params.length ? `?${params.join('&')}` : ''}` });
  },

  onBookmark(e) {
    if (!api.requireAuth('/pages/index/index')) return;
    const id = e.detail.id;
    if (!id) return;
    const active = api.toggleBookmark(id);
    // 局部更新对应卡片的收藏态，避免整列表重渲
    const hackathons = this.data.hackathons.map((item) =>
      item.id === id ? Object.assign({}, item, { bookmarked: active }) : item,
    );
    this.setData({ hackathons });
    wx.showToast({ title: active ? '已收藏' : '已取消收藏', icon: 'none' });
  },
});
