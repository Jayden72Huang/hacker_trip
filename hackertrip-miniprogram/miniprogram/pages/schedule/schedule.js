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
    hasJoined: false,
    phases: [],
    todos: [],
    loading: true,
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
    // 我加入的赛事（用 api 取最新状态，已删除的赛事回退到报名快照）
    const regs = api.getRegistrations();
    let myEvents = [];
    try {
      myEvents = await Promise.all(
        regs.map(async (reg) => (await api.getHackathonDetail(reg.id)) || reg),
      );
    } catch (err) {
      myEvents = regs;
    }

    // 活跃赛事：优先我加入的进行中赛事，其次我加入的第一个，最后回退全站演示
    let fallback = [];
    try {
      fallback = await api.getHackathons();
    } catch (err) {
      fallback = [];
    }
    const activeEvent =
      myEvents.find((item) => item.status === 'ongoing') ||
      myEvents[0] ||
      fallback.find((item) => item.status === 'ongoing') ||
      fallback[0] ||
      null;

    this.setData({
      activeEvent,
      myEvents,
      hasJoined: myEvents.length > 0,
      phases: buildPhases(activeEvent && activeEvent.status === 'upcoming' ? 1 : 4),
      todos: this.buildTodos(activeEvent),
      loading: false,
    });
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
});
