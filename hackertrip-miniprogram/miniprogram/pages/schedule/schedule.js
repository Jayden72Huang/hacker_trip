const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
const share = require('../../utils/share.js');

const PHASES = ['发现', '报名', '组队', '开题', '开发', '提交', '路演'];

function buildPhases(activeIndex) {
  return PHASES.map((label, index) => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'pending',
  }));
}

/** 距今天数：>0 未来，=0 今天，<0 已过；无效日期返回 null */
function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const today = new Date(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`);
  const target = new Date(`${String(dateStr)}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

/** 由赛事真实日期推导当前所处阶段（不再拍脑袋写死） */
function phaseIndexFor(event) {
  if (!event) return 0;
  if (event.status === 'ended') return PHASES.length; // 全部 done
  if (event.status === 'ongoing') return 4; // 开发中
  // upcoming：报名截止前=报名阶段，截止后开赛前=组队阶段
  const ddl = daysFromToday(event.registrationDeadline);
  if (ddl !== null && ddl < 0) return 2;
  return 1;
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
    share.enableShareMenu();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 从详情页「加入赛程」后返回时刷新我的赛程
    this.load();
  },

  onLoad(options) {
    share.enableShareMenu();
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
      const resolved = await Promise.all(regs.map(async (reg) => api.getHackathonDetail(reg.id)));
      myEvents = resolved.filter(Boolean);
    } catch (err) {
      myEvents = [];
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
      phases: activeEvent ? buildPhases(phaseIndexFor(activeEvent)) : [],
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

  // 基于真实状态生成待办（不再展示写死的假时间表）
  buildTodos(event) {
    if (!event) return [];
    const todos = [];

    // 1. 报名截止（真实日期派生）
    const ddl = daysFromToday(event.registrationDeadline);
    if (event.status !== 'ended' && ddl !== null && ddl >= 0) {
      todos.push({
        time: ddl === 0 ? '今天' : `${ddl} 天后`,
        title: '报名截止，别错过',
        sub: `${event.shortName || event.name} · ${event.registrationDeadline} 截止报名`,
        action: '查看详情',
        url: `/pages/detail/detail?id=${event.id}`,
      });
    }

    // 2. 资料完善度（真实档案判断）
    const profile = api.getProfile();
    const scan = api.getScanResults();
    if (!profile.skills || !profile.skills.length) {
      todos.push({
        time: '建议',
        title: '补全技术栈',
        sub: '完善技能标签，赛事推荐和组队匹配更准',
        action: '去完善',
        url: '/pages/identity-edit/identity-edit',
      });
    } else if (!scan || !scan.syncedAt) {
      todos.push({
        time: '建议',
        title: '同步 Skills 履历',
        sub: '用 CLI 把项目画像同步进来，生成更强的身份卡',
        action: '去同步',
        url: '/pages/sync/sync',
      });
    }

    // 3. 身份卡（组队传播抓手，始终提供入口）
    todos.push({
      time: '组队',
      title: '生成参赛身份卡',
      sub: '分享到赛事群，让队友找到你',
      action: '生成卡片',
      url: '/pages/identity/identity',
    });

    return todos;
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

  async removeBookmark(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const auth = await api.requireAuth(this, '/pages/schedule/schedule', '登录后才能管理你的收藏赛事。');
    if (!auth) return;
    try {
      const active = await api.toggleBookmark(id);
      if (!active) {
        wx.showToast({ title: '已取消收藏', icon: 'none' });
        this.load();
      }
    } catch (err) {
      wx.showToast({ title: '取消失败，请重试', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return share.buildScheduleShare();
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildScheduleShare());
  },
});
