const api = require('../../utils/api.js');
const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');
const share = require('../../utils/share.js');

/** 计算 dateStr(YYYY-MM-DD) 距今天的天数：>0 未来，=0 今天，<0 已过 */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(catalog.formatDate(new Date()) + 'T00:00:00');
  const target = new Date(String(dateStr) + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

/** 由一条已报名赛事派生截止提醒（无可用日期返回 null） */
function toDeadlineItem(reg) {
  // 优先报名截止，其次赛事结束日
  const deadline = reg.registrationDeadline || reg.endDate;
  const days = daysUntil(deadline);
  if (days === null) return null;

  let level = 'system';
  let time = '';
  if (days < 0) {
    return null; // 已结束的不再提醒
  } else if (days === 0) {
    level = 'urgent';
    time = '今天截止';
  } else if (days <= 3) {
    level = 'urgent';
    time = `还剩 ${days} 天`;
  } else if (days <= 7) {
    level = 'match';
    time = `还剩 ${days} 天`;
  } else {
    level = 'system';
    time = `还剩 ${days} 天`;
  }

  const isReg = !!reg.registrationDeadline;
  return {
    level,
    title: `${reg.shortName || reg.name || '黑客松'} ${isReg ? '报名即将截止' : '即将开赛'}`,
    sub: `${reg.startDate || '待确认'} - ${reg.endDate || '待确认'} · ${reg.location || reg.city || '地点待确认'} · ${reg.modeText || '形式待确认'}`,
    time,
    tag: isReg ? '报名截止' : (reg.prizePool || '赛程'),
    url: reg.id ? `/pages/detail/detail?id=${reg.id}` : '/pages/discover/discover',
    _days: days,
  };
}

function buildGroups(registrations, bookmarked) {
  const regs = Array.isArray(registrations) ? registrations : [];
  const marks = Array.isArray(bookmarked) ? bookmarked : [];
  const groups = [];

  // 截止提醒：报名 + 收藏的赛事都提醒，按 id 去重（报名记录优先），剩余天数升序
  const seen = {};
  const sources = [];
  regs.forEach((item) => {
    if (item && item.id && !seen[item.id]) { seen[item.id] = true; sources.push(item); }
  });
  marks.forEach((item) => {
    if (item && item.id && !seen[item.id]) { seen[item.id] = true; sources.push(item); }
  });
  const deadlineItems = sources
    .map(toDeadlineItem)
    .filter(Boolean)
    .sort((a, b) => a._days - b._days);

  groups.push({
    key: 'deadline',
    title: '截止提醒',
    empty: deadlineItems.length === 0 ? '暂无提醒，去发现页订阅或报名赛事' : '',
    items: deadlineItems,
  });

  // 系统通知：仅保留真实、稳定可解释的条目
  groups.push({
    key: 'system',
    title: '系统',
    items: [
      {
        level: 'system',
        title: '欢迎来到 HackerTrip 👋',
        sub: '报名或收藏赛事后，报名截止和赛程提醒会自动出现在这里',
        time: '',
        tag: '提示',
        url: '/pages/discover/discover',
      },
    ],
  });

  return groups;
}

Page({
  data: {
    title: '消息',
    aiBanner: false,
    aiIntentText: '消息提醒',
    groups: [],
    loading: true,
  },

  onShow() {
    share.enableShareMenu();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 报名/登录状态可能在其它页变化，每次进入重算提醒
    if (!this.data.loading) this.loadMessages();
  },

  onLoad(options) {
    share.enableShareMenu();
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '消息提醒',
    });
    this.loadMessages();
  },

  async loadMessages() {
    this.setData({ loading: true });
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    let bookmarked = [];
    try {
      bookmarked = api.isLoggedIn() ? await api.getBookmarkedHackathons() : [];
    } catch (e) {
      bookmarked = [];
    }
    this.setData({
      groups: buildGroups(api.getRegistrations(), bookmarked),
      loading: false,
    });
  },

  async subscribeHackathonMessages() {
    const auth = await api.requireAuth(this, '/pages/inbox/inbox', '登录后订阅黑客松上新、智能推荐和报名截止提醒。');
    if (!auth) return;
    const res = await api.requestMessageSubscriptions(
      [
        api.SUBSCRIBE_TYPES.NEW_HACKATHON,
        api.SUBSCRIBE_TYPES.SMART_RECOMMENDATION,
        api.SUBSCRIBE_TYPES.DEADLINE_REMINDER,
      ],
      'inbox_notifications',
      { page: 'inbox' },
    );
    if (!res.ok) {
      wx.showModal({
        title: '订阅暂不可用',
        content: res.code === 'TEMPLATE_NOT_CONFIGURED'
          ? '还没有配置微信订阅消息模板 ID。请先在微信公众平台添加模板，再填入 miniprogram/env.js。'
          : (res.message || '请稍后再试'),
        showCancel: false,
      });
      return;
    }
    wx.showToast({ title: res.acceptedTypes.length ? '已开启提醒' : '未授权提醒', icon: 'none' });
  },

  onShareAppMessage() {
    return share.buildInboxShare();
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildInboxShare());
  },
});
