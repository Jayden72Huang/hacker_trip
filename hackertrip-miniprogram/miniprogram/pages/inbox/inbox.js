const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');

function buildGroups() {
  const all = catalog.getAll();
  const first = all[0] || {};
  const second = all[1] || first;

  return [
    {
      key: 'deadline',
      title: '截止提醒',
      items: [
        {
          level: 'urgent',
          title: `${first.shortName || first.name || '黑客松'} 正在进行`,
          sub: `${first.startDate || '待确认'} - ${first.endDate || '待确认'} · ${first.location || '地点待确认'} · ${first.modeText || '形式待确认'}`,
          time: '今天',
          tag: first.prizePool || '奖金待确认',
          url: first.id ? `/pages/detail/detail?id=${first.id}` : '/pages/index/index',
        },
      ],
    },
    {
      key: 'match',
      title: '匹配结果',
      items: [
        {
          level: 'match',
          title: 'Haki 找到 3 个潜在队友',
          sub: `与你关注的 ${second.shortName || second.name || 'AI 黑客松'} 技术栈相近：AI、LLM、产品设计`,
          time: '1 小时前',
          tag: '匹配 92%',
          url: '/pages/match/match',
        },
        {
          level: 'match',
          title: '有人查看了你的身份卡',
          sub: '深圳湾 AI 硬件方向的参赛者正在寻找前端与硬件协作伙伴',
          time: '昨天',
          tag: '身份卡',
          url: '/pages/identity/identity',
        },
      ],
    },
    {
      key: 'system',
      title: '系统',
      items: [
        {
          level: 'system',
          title: 'HackerTrip 已启用微信 AI 入口',
          sub: '从微信 AI 进入页面时，会保留任务来源和 intent 参数',
          time: '刚刚',
          tag: 'AI',
          url: '/pages/settings/settings',
        },
        {
          level: 'system',
          title: '技能同步建议',
          sub: '同步 GitHub 项目后，Haki 会更准确推荐黑客松和队友',
          time: '昨天',
          tag: 'Sync',
          url: '/pages/sync/sync',
        },
      ],
    },
  ];
}

Page({
  data: {
    title: '消息',
    aiBanner: false,
    aiIntentText: '消息提醒',
    groups: [],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
  },

  onLoad(options) {
    const ai = parseAIEntry(options);

    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '消息提醒',
      groups: buildGroups(),
    });
  },
});
