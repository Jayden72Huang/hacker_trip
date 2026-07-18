const api = require('../../utils/api.js');
const { buildCityOptions, matchHackathonCity, matchHackathonQuery } = require('../../utils/hackathon-search.js');
const { SORT_OPTIONS, decorateCardItem, sortCardItems, getSortLabel } = require('../../utils/hackathon-card-data.js');
const share = require('../../utils/share.js');
const registration = require('../../utils/registration-link.js');

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
    this.loadHeatMap(all);
  },

  // 拉取真实热度后重绘（SWR：先出列表，热度到了再补），拉不到就不展示热度
  loadHeatMap(all) {
    const ids = (all || this.allEvents).map((item) => item.id).filter(Boolean);
    if (!ids.length) return;
    api.getHackathonHeatMap(ids).then((map) => {
      if (map) {
        this._heatMap = map;
        this.applyFilters();
      }
    }).catch(() => {});
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

    const marked = sortCardItems(hackathons.map((item) => decorateCardItem(item, this._heatMap)), this.data.sortKey);

    this.setData({
      hackathons: marked,
      filteredCount: marked.length,
      scopeCount: cityEvents.length,
    });
  },

  async onBookmark(e) {
    const id = e.detail.id;
    if (!id) return;
    // 订阅动作：在 tap 手势内先唤起微信订阅消息授权，再走异步收藏（登录由 api 层静默补上）
    const subscribePromise = !api.isBookmarked(id)
      ? api.subscribeBookmarkReminders(id, 'list_bookmark')
      : null;
    const auth = await api.requireAuth(this, '/pages/hackathon-list/hackathon-list', '登录后才能订阅赛事，并在你的账号中同步查看。');
    if (!auth) return;
    const active = await api.toggleBookmark(id);
    const subRes = subscribePromise ? await subscribePromise : null;
    const reminderOn = !!(subRes && subRes.ok && subRes.acceptedTypes && subRes.acceptedTypes.length);
    this.applyFilters();
    wx.showToast({
      title: active ? (reminderOn ? '已订阅，将提醒报名截止' : '已订阅') : '已取消订阅',
      icon: 'none',
    });
  },

  onRegister(e) {
    const id = e.detail && e.detail.id;
    const item = this.data.hackathons.find((entry) => entry.id === id) || {};
    const link = registration.openRegistration(item);
    if (!link) {
      // 没有可信报名链接（资讯稿不算）：进详情页走平台报名
      wx.navigateTo({ url: `/pages/detail/detail?id=${id || ''}` });
    }
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
