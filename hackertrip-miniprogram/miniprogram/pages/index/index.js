const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
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

function hasPersonalizedReason(item) {
  if (!item) return false;
  if (item.fitReason) return true;
  if (Number(item.matchScore) > 0) return true;
  return Array.isArray(item.matchedTags) && item.matchedTags.length > 0;
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
    sortKey: 'heat',
    sortLabel: '热度优先',
    sortOptions: SORT_OPTIONS,
    sortPickerVisible: false,
    activeFeaturedTab: 'featured',
    featured: [],
    curatedFeatured: [],
    recommendedFeatured: [],
    recommendationHint: '',
    recommendationState: 'ready',
    hackathons: [],
    filteredCount: 0,
    totalCount: 0,
    loading: true,
  },

  // 云端拉取的全量赛事，applyFilters 基于此做内存过滤
  allEvents: [],

  async onShow() {
    share.enableShareMenu();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 从详情等页返回时同步收藏态（用已缓存的 allEvents，不重复请求云端）
    if (this.allEvents.length) {
      if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
      this.applyFilters();
    }
  },

  async onLoad(options) {
    share.enableShareMenu();
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '发现黑客松',
    });
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});

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
      curatedFeatured: decorateFeatured(all),
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

  async refreshRecommended(source) {
    const all = source || this.allEvents;
    if (!api.isLoggedIn()) {
      const next = {
        recommendedFeatured: [],
        recommendationHint: '登录后基于你的技能、GitHub、作品和 Skills 同步结果推荐赛事。',
        recommendationState: 'login',
      };
      if (this.data.activeFeaturedTab === 'mine') next.featured = [];
      this.setData(next);
      return;
    }

    const res = await api.getRecommendedHackathons({
      source: all,
      city: this.data.city,
      limit: 4,
    });
    const rawRecommended = (res && Array.isArray(res.list) ? res.list : [])
      .filter(hasPersonalizedReason);
    const recommendedFeatured = decorateFeatured(rawRecommended);
    const hasPersonalizedMatches = !!(res && res.personalized && recommendedFeatured.length);
    const next = {
      recommendedFeatured: hasPersonalizedMatches ? recommendedFeatured : [],
      recommendationHint: res && res.message ? res.message : '',
      recommendationState: hasPersonalizedMatches ? 'ready' : 'profile',
    };
    if (this.data.activeFeaturedTab === 'mine') {
      next.featured = next.recommendedFeatured;
    }
    this.setData(next);
  },

  onFeaturedTabTap(e) {
    const tab = e.currentTarget.dataset.tab || 'featured';
    const featured = tab === 'mine'
      ? []
      : this.data.curatedFeatured;
    this.setData({ activeFeaturedTab: tab, featured, recommendationHint: '' });
    if (tab === 'mine') {
      this.refreshRecommended();
    }
  },

  async openRecommendationLogin() {
    const auth = await api.requireAuth(this, '/pages/index/index', '登录后生成适合你的黑客松推荐。');
    if (!auth) return;
    await api.syncUserDataIfLoggedIn().catch(() => {});
    this.refreshRecommended();
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/identity-edit/identity-edit' });
  },

  goSyncSkills() {
    wx.navigateTo({ url: '/pages/sync/sync' });
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
      curatedFeatured: decorateFeatured(cityEvents),
      featured: this.data.activeFeaturedTab === 'mine'
        ? this.data.recommendedFeatured
        : decorateFeatured(cityEvents),
      hackathons: marked.slice(0, 4),
      filteredCount: marked.length,
    });
    this.refreshRecommended(cityEvents);
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

  async onBookmark(e) {
    const auth = await api.requireAuth(this, '/pages/index/index', '登录后才能订阅赛事，并在你的账号中同步查看。');
    if (!auth) return;
    const id = e.detail.id;
    if (!id) return;
    const active = await api.toggleBookmark(id);
    this.applyFilters();
    wx.showToast({ title: active ? '已订阅' : '已取消订阅', icon: 'none' });
  },

  goDetail(e) {
    const id = (e.detail && e.detail.id) || (e.currentTarget && e.currentTarget.dataset.id);
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
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

  onShareAppMessage() {
    return share.buildHomeShare();
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildHomeShare());
  },
});
