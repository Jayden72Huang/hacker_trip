const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

const PHASES = ['发现', '报名', '组队', '开题', '开发', '提交', '路演'];

function buildPhases(activeIndex) {
  return PHASES.map((label, index) => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'pending',
  }));
}

Page({
  data: {
    title: '赛程',
    aiBanner: false,
    aiIntentText: '赛程状态',
    activeEvent: null,
    myEvents: [],
    bookmarkedEvents: [],
    hasJoined: false,
    hasBookmarks: false,
    phases: [],
    todos: [],
    loading: true,
    isLoggedIn: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 从详情页「加入赛程」后返回时刷新我的赛程
    this.load();
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '赛程状态',
    });
    this.load();
  },

  async load() {
    const isLoggedIn = api.isLoggedIn();
    this.setData({ loading: true, isLoggedIn });
    if (isLoggedIn) await api.syncUserDataIfLoggedIn().catch(() => {});

    // 我加入的赛事（用 api 取最新状态，已删除的赛事回退到报名快照）
    const regs = isLoggedIn ? api.getRegistrations() : [];
    let myEvents = [];
    try {
      myEvents = await Promise.all(
        regs.map(async (reg) => (await api.getHackathonDetail(reg.id)) || reg),
      );
    } catch (err) {
      myEvents = regs;
    }

    let bookmarkedEvents = [];
    try {
      bookmarkedEvents = isLoggedIn ? await api.getBookmarkedHackathons() : [];
    } catch (err) {
      bookmarkedEvents = [];
    }

    // 活跃赛事只来自用户明确加入或收藏的赛事，避免把全站推荐误显示为“正在关注”。
    const activeEvent =
      myEvents.find((item) => item.status === 'ongoing') ||
      myEvents[0] ||
      bookmarkedEvents.find((item) => item.status === 'ongoing') ||
      bookmarkedEvents[0] ||
      null;

    this.setData({
      activeEvent,
      myEvents,
      bookmarkedEvents,
      hasJoined: myEvents.length > 0,
      hasBookmarks: bookmarkedEvents.length > 0,
      phases: activeEvent ? buildPhases(activeEvent.status === 'upcoming' ? 1 : 4) : [],
      todos: this.buildTodos(activeEvent),
      loading: false,
    });
  },

  async openLogin() {
    if (api.isLoggedIn()) {
      wx.showToast({ title: '微信已登录', icon: 'none' });
      return;
    }
    const modal = this.selectComponent('#authModal');
    if (!modal || !modal.open) return;
    const auth = await modal.open({ reason: '登录后可以同步你的赛程和收藏赛事。' });
    if (auth) this.load();
  },

  onAuthLogin() {
    this.load();
  },

  buildTodos(event) {
    if (!event) return [];

    return [
      {
        time: '10:00',
        title: '确认赛事资料',
        sub: `${event.shortName || event.name} · ${event.city} · ${event.modeText}`,
        action: '查看详情',
        url: `/pages/detail/detail?id=${event.id}`,
      },
      {
        time: '14:00',
        title: '同步团队技能',
        sub: '补全技术栈，提升组队匹配质量',
        action: '去同步',
        url: '/pages/sync/sync',
      },
      {
        time: '20:00',
        title: '生成参赛身份卡',
        sub: '用于社群分享和队友招募',
        action: '生成卡片',
        url: '/pages/identity/identity',
      },
    ];
  },

  openEvent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  async removeEvent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const auth = await api.requireAuth(this, '/pages/schedule/schedule', '登录后才能从你的赛程中移除比赛。');
    if (!auth) return;
    try {
      await api.removeRegistration(id);
      wx.showToast({ title: '已移出赛程', icon: 'none' });
      this.load();
    } catch (err) {
      wx.showToast({ title: '取消失败，请重试', icon: 'none' });
    }
  },
});
