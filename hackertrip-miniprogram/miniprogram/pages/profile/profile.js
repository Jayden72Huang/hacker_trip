const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '我的',
    aiBanner: false,
    aiIntentText: '个人中心',
    avatarChar: 'H',
    activeCount: 0,
    savedCount: 0,
    assetStats: [],
    loading: true,
    tools: [
      { title: '身份卡编辑', sub: '完善头像、技能栈和参赛宣言', url: '/pages/identity-edit/identity-edit' },
      { title: '项目作品集', sub: '整理作品，用于报名和分享', url: '/pages/portfolio/portfolio' },
      { title: 'Agent 技能库', sub: '管理 Haki 可读取的项目能力', url: '/pages/agent/agent' },
      { title: 'Skills 同步', sub: '从 GitHub/本地项目同步技术栈', url: '/pages/sync/sync' },
    ],
    settings: [
      { title: '账号设置', sub: '登录方式、通知和隐私', url: '/pages/settings/settings' },
      { title: '公开主页', sub: '预览你的 HackerTrip 主页', url: '/pages/public-site/public-site' },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 收藏/报名/身份卡变化后返回时刷新资产
    this.load();
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '个人中心',
    });
    this.load();
  },

  async load() {
    const stats = api.getUserStats();
    const profile = api.getProfile();
    // 我加入的进行中赛事数（用 api 取最新状态）
    const regs = api.getRegistrations();
    let joined = [];
    try {
      joined = await Promise.all(
        regs.map(async (reg) => (await api.getHackathonDetail(reg.id)) || reg),
      );
    } catch (err) {
      joined = regs;
    }
    const ongoing = joined.filter((item) => item && item.status === 'ongoing').length;

    this.setData({
      loading: false,
      avatarChar: (profile.nickname || 'H').trim().charAt(0).toUpperCase() || 'H',
      activeCount: ongoing,
      savedCount: stats.bookmarks,
      assetStats: [
        { label: '关注赛事', value: `${stats.bookmarks}` },
        { label: '进行中', value: `${ongoing}` },
        { label: '身份卡', value: `${stats.projects}` },
      ],
    });
  },
});
