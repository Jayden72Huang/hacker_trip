const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

const DEFAULT_PROJECT = {
  name: 'AI Prototype Builder',
  domain: 'AI 开发工具 / 协作效率',
  summary: '用 TypeScript、LLM 和前端组件快速生成可展示产品原型。',
  techStack: ['TypeScript', 'React', 'LLM', 'Node.js'],
};

function scoreItem(item, stack, index) {
  const text = [
    item.name,
    item.theme,
    (item.tracks || []).join(' '),
    (item.techStack || []).join(' '),
    (item.tags || []).join(' '),
  ].join(' ').toLowerCase();
  const hits = stack.filter((tag) => text.indexOf(String(tag).toLowerCase()) !== -1);
  const score = Math.min(98, 76 + hits.length * 7 + Math.max(0, 4 - index) * 2);

  return {
    id: item.id,
    name: item.name,
    dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
    cityText: item.city || item.location || '待确认',
    prizeText: item.prizePool || '待确认',
    tracksText: (item.tracks || []).slice(0, 3).join(' / ') || '待确认',
    reason: hits.length ? `命中 ${hits.join('、')}，适合当前项目方向。` : `赛道为 ${item.theme || '综合创新'}，适合扩展项目原型。`,
    score,
    scoreWidth: `${score}%`,
  };
}

Page({
  data: {
    title: '匹配结果',
    aiBanner: false,
    aiIntentText: '项目匹配',
    project: DEFAULT_PROJECT,
    matches: [],
    loading: true,
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    const scan = api.getScanResults();
    const project = scan && scan.project && scan.project.name ? scan.project : DEFAULT_PROJECT;
    const stack = Array.isArray(project.techStack) ? project.techStack : DEFAULT_PROJECT.techStack;

    let source = [];
    try {
      source = await api.getHackathons();
      if (!source.length) source = await api.getHackathons({ includeEnded: true });
    } catch (err) {
      source = [];
    }
    const matches = source
      .map((item, index) => scoreItem(item, stack, index))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || '项目匹配',
      project,
      matches,
      loading: false,
    });
  },

  makeCard() {
    wx.navigateTo({ url: '/pages/identity/identity' });
  },
});
