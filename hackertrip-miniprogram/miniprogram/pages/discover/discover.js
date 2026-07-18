const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
const { buildCityOptions, matchHackathonCity, matchHackathonQuery } = require('../../utils/hackathon-search.js');
const { SORT_OPTIONS, decorateCardItem, sortCardItems, getSortLabel } = require('../../utils/hackathon-card-data.js');
const share = require('../../utils/share.js');
const registration = require('../../utils/registration-link.js');
const { PARTNERS } = require('../../data/partners.js');

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
    partners: PARTNERS,
  },

  // 云端拉取的全量赛事，applyFilters 基于此做内存过滤
  allEvents: [],

  onShow() {
    share.enableShareMenu();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 从详情等页返回时同步收藏态：本地数据立即重绘，云同步放后台
    if (this.allEvents.length) {
      this.applyFilters();
      if (api.isLoggedIn()) {
        api.syncUserDataIfLoggedIn()
          .then(() => this.applyFilters())
          .catch(() => {});
      }
    }
  },

  async onLoad(options) {
    share.enableShareMenu();
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '发现黑客松',
    });

    // 1. 上次云端结果缓存先渲染，首屏秒开
    const cached = api.getCachedHackathons();
    if (cached.length) this.renderEvents(cached);

    // 2. 登录数据同步放后台，不阻塞列表首屏
    if (api.isLoggedIn()) {
      api.syncUserDataIfLoggedIn()
        .then(() => { if (this.allEvents.length) this.applyFilters(); })
        .catch(() => {});
    }

    // 3. 拉取云端最新列表；与缓存一致时跳过重绘，避免页面闪两次
    let all = [];
    let fromCloud = false;
    try {
      const res = await api.getHackathonsWithMeta();
      all = res.list;
      fromCloud = res.fromCloud;
    } catch (err) {
      all = [];
    }
    // 云端没成功（降级到内置种子数据）时，保留已渲染的缓存，不用旧数据覆盖
    if (!fromCloud && cached.length) return;
    if (cached.length && JSON.stringify(all) === JSON.stringify(cached)) return;
    this.renderEvents(all);
  },

  renderEvents(all) {
    this.allEvents = all;
    this.setData({
      cities: buildCityOptions(all),
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

  openCityPicker() {
    this.setData({ cityPickerVisible: true, sortPickerVisible: false });
  },

  closeCityPicker() {
    this.setData({ cityPickerVisible: false });
  },

  openSortPicker() {
    this.setData({
      sortPickerVisible: !this.data.sortPickerVisible,
      cityPickerVisible: false,
    });
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
    const auth = await api.requireAuth(this, '/pages/discover/discover', '登录后生成适合你的黑客松推荐。');
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
    const city = this.data.city;
    const cityEvents = all.filter((item) => matchHackathonCity(item, city));

    const hackathons = cityEvents.filter((item) => matchHackathonQuery(item, query));

    const marked = sortCardItems(hackathons.map((item) => decorateCardItem(item, this._heatMap)), this.data.sortKey);

    this.setData({
      curatedFeatured: decorateFeatured(cityEvents),
      featured: this.data.activeFeaturedTab === 'mine'
        ? this.data.recommendedFeatured
        : decorateFeatured(cityEvents),
      hackathons: marked.slice(0, 4),
      filteredCount: marked.length,
    });
    // 推荐依赖云端匹配，只在「为我推荐」tab 激活时刷新，避免每次筛选都请求云端
    if (this.data.activeFeaturedTab === 'mine') {
      this.refreshRecommended(cityEvents);
    }
  },

  goMore() {
    const params = [];
    if (this.data.city && this.data.city !== '全国') {
      params.push(`city=${encodeURIComponent(this.data.city)}`);
    }
    if (this.data.query.trim()) {
      params.push(`q=${encodeURIComponent(this.data.query.trim())}`);
    }
    wx.navigateTo({ url: `/pages/hackathon-list/hackathon-list${params.length ? `?${params.join('&')}` : ''}` });
  },

  async onBookmark(e) {
    const id = e.detail.id;
    if (!id) return;
    // 订阅动作：在 tap 手势内先唤起微信订阅消息授权，再走异步收藏（登录由 api 层静默补上）
    const subscribePromise = !api.isBookmarked(id)
      ? api.subscribeBookmarkReminders(id, 'discover_bookmark')
      : null;
    const auth = await api.requireAuth(this, '/pages/discover/discover', '登录后才能订阅赛事，并在你的账号中同步查看。');
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

  goDetail(e) {
    const id = (e.detail && e.detail.id) || (e.currentTarget && e.currentTarget.dataset.id);
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
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

  onShareAppMessage() {
    return share.buildHomeShare();
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildHomeShare());
  },
});
