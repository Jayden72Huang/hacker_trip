const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

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
    title: '发现黑客松',
    aiBanner: false,
    aiIntentText: '继续任务',
    city: '深圳',
    query: '',
    activeFilter: 'all',
    filters: FILTERS,
    focusEvent: null,
    featured: [],
    hackathons: [],
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
    const focusEvent = all.find((item) => item.status === 'ongoing') || all[0] || null;

    this.setData({
      focusEvent,
      featured: all.slice(0, 4),
      totalCount: all.length,
      loading: false,
    });
    this.applyFilters(all);
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value || '' });
    this.applyFilters();
  },

  onFilterTap(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key || 'all' });
    this.applyFilters();
  },

  applyFilters(source) {
    const all = source || this.allEvents;
    const query = this.data.query.trim().toLowerCase();
    const activeFilter = this.data.activeFilter;

    const hackathons = all.filter((item) => {
      const searchable = [
        item.name,
        item.shortName,
        item.city,
        item.location,
        item.theme,
        item.summary,
        item.prizePool,
        ...(item.tracks || []),
        ...(item.techStack || []),
        ...(item.tags || []),
      ].join(' ').toLowerCase();

      return matchFilter(item, activeFilter) && (!query || searchable.includes(query));
    });

    // 标记收藏态供卡片高亮
    const marked = hackathons.map((item) => Object.assign({}, item, {
      bookmarked: api.isBookmarked(item.id),
    }));

    this.setData({ hackathons: marked });
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
