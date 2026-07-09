const api = require('../../utils/api.js');
const catalog = require('../../utils/catalog.js');

const STATUS_TEXT = {
  upcoming: '即将出发',
  ongoing: '进行中',
  ended: '已完成',
};

/** 把参赛记录变成旅行站点：优先用缓存的最新赛事数据，缺了用报名快照派生 */
function buildStops(registrations, achievements, cachedEvents, today) {
  const achByEvent = {};
  (achievements || []).forEach((item) => {
    const key = item && (item.eventId || item.id);
    if (!key) return;
    if (!achByEvent[key]) achByEvent[key] = [];
    achByEvent[key].push(item);
  });

  const stops = (registrations || []).map((reg) => {
    const latest = (cachedEvents || []).find((h) => h.id === reg.id) || catalog.decorate(reg, today);
    const status = latest.status || 'upcoming';
    return {
      id: reg.id,
      name: latest.shortName || latest.name || reg.shortName || reg.name || '黑客松',
      dateText: latest.startDate
        ? `${latest.startDate}${latest.endDate ? ` - ${latest.endDate}` : ''}`
        : '日期待确认',
      startDate: latest.startDate || '',
      place: latest.city || latest.location || '地点待确认',
      modeText: latest.modeText || '',
      status,
      statusText: STATUS_TEXT[status] || '已报名',
      badges: (achByEvent[reg.id] || []).map(decorateAchievement),
    };
  });
  // 时间倒序：最近的旅程在最上面
  stops.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));

  // 未匹配到参赛记录的认证（比如线下赛主办方直接录入的）单独展示
  const matched = {};
  stops.forEach((s) => { matched[s.id] = true; });
  const extras = (achievements || [])
    .filter((item) => item && !matched[item.eventId || item.id])
    .map(decorateAchievement);

  return { stops, extras };
}

function decorateAchievement(item) {
  const level = String(item.level || '').toLowerCase();
  const isAward = /win|champion|first|gold|silver|bronze|奖|冠军|亚军|季军|入围|finalist/i.test(`${level} ${item.title || ''}`);
  return Object.assign({}, item, {
    isAward,
    levelText: item.title || '参赛记录',
    byText: item.verifiedByName || 'HackerTrip 主办方',
    eventText: item.eventName || item.eventId || '',
  });
}

Page({
  data: {
    title: '黑客松旅行',
    loading: true,
    isLoggedIn: false,
    stops: [],
    extras: [],
    stats: { total: 0, awards: 0, verified: 0 },
  },

  onShow() {
    // SWR：本地数据先渲染，云端校验放后台
    this.renderLocal();
    this.revalidate();
  },

  renderLocal() {
    const isLoggedIn = api.isLoggedIn();
    const today = catalog.formatDate(new Date());
    const regs = isLoggedIn ? api.getRegistrations() : [];
    const achievements = isLoggedIn ? api.getLocalAchievements() : [];
    const cached = api.getCachedHackathons({ includeEnded: true });
    const { stops, extras } = buildStops(regs, achievements, cached, today);
    const verified = achievements.filter((item) => item && item.verified).length;
    const awards = achievements.filter((item) => decorateAchievement(item).isAward).length;
    this.setData({
      loading: false,
      isLoggedIn,
      stops,
      extras,
      stats: { total: stops.length, awards, verified },
    });
  },

  async revalidate() {
    if (!api.isLoggedIn()) return;
    await api.syncUserDataIfLoggedIn().catch(() => {});
    await api.listAchievements().catch(() => {}); // 成功会写入本地缓存
    this.renderLocal();
  },

  goDiscover() {
    wx.switchTab({ url: '/pages/discover/discover' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  async openLogin() {
    const modal = this.selectComponent('#authModal');
    if (!modal || !modal.open) return;
    const auth = await modal.open({ reason: '登录后同步你的黑客松旅行和认证记录。' });
    if (auth) {
      this.renderLocal();
      this.revalidate();
    }
  },

  onAuthLogin() {
    this.renderLocal();
    this.revalidate();
  },
});
