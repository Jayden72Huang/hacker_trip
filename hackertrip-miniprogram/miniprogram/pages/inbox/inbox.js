const api = require('../../utils/api.js');
const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');

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
    url: reg.id ? `/pages/detail/detail?id=${reg.id}` : '/pages/index/index',
    _days: days,
  };
}

function buildGroups(registrations) {
  const regs = Array.isArray(registrations) ? registrations : [];
  const groups = [];

  // 截止提醒：基于真实报名记录，按剩余天数升序（越紧急越靠前）
  const deadlineItems = regs
    .map(toDeadlineItem)
    .filter(Boolean)
    .sort((a, b) => a._days - b._days);

  groups.push({
    key: 'deadline',
    title: '截止提醒',
    empty: deadlineItems.length === 0 ? '暂无提醒，去发现页关注赛事' : '',
    items: deadlineItems,
  });

  // 系统通知：仅保留真实、稳定可解释的条目
  groups.push({
    key: 'system',
    title: '系统',
    items: [
      {
        level: 'system',
        title: 'HackerTrip 已启用微信 AI 入口',
        sub: '从微信 AI 进入页面时，会保留任务来源和 intent 参数',
        time: '',
        tag: 'AI',
        url: '/pages/settings/settings',
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 报名/登录状态可能在其它页变化，每次进入重算提醒
    if (!this.data.loading) {
      this.setData({ groups: buildGroups(api.getRegistrations()) });
    }
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '消息提醒',
      groups: buildGroups(api.getRegistrations()),
      loading: false,
    });
  },
});
