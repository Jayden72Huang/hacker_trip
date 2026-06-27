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
    // 卡内数据指标：进行中赛事 + 身份卡数（初始占位，load 后填真实值）
    assetStats: [
      { label: '进行中', value: '—' },
      { label: '身份卡', value: '—' },
    ],
    loading: true,
    isLoggedIn: false,
    authAccount: { name: '未登录', avatarUrl: '', copy: '登录后同步身份卡、赛程、收藏和 Skills 结果' },
    // 个人资料卡：filled=是否已填写过(决定高亮 or 引导)
    profileCard: { filled: false, avatarUrl: '', avatarChar: 'H', nickname: '', role: '', city: '', skills: [], skillsText: '' },
    profileMode: 'participant',
    organizerStatus: 'none',
    organizerStatusText: '未申请',
    organizerTools: [],
    tools: [
      { title: '我的身份卡', sub: '生成参赛身份卡，分享找队友', url: '/pages/identity/identity' },
      { title: '卡册 · 成就解锁', sub: '集齐限定卡面，邀请好友解锁稀有卡', url: '/pages/cardbook/cardbook' },
      { title: '项目作品集', sub: '整理作品，用于报名和分享', url: '/pages/portfolio/portfolio' },
      { title: 'Agent 技能库', sub: '管理 Haki 可读取的项目能力', url: '/pages/agent/agent' },
      { title: 'Skills 同步', sub: '从 GitHub/本地项目同步技术栈', url: '/pages/sync/sync' },
    ],
    settings: [],
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
    const auth = api.getAuth();
    if (auth) await api.syncUserDataIfLoggedIn().catch(() => {});
    const stats = api.getUserStats();
    const profile = api.getProfile();
    const profileMode = api.getProfileMode();
    const organizer = api.getOrganizerApplication();
    const adminState = auth && api.cloudReady()
      ? await api.checkHackathonAdmin().catch(() => ({ isAdmin: false }))
      : { isAdmin: false };
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
    const cardsCount = api.getCards().length;

    const avatarChar = (profile.nickname || 'H').trim().charAt(0).toUpperCase() || 'H';
    // 编辑过资料 或 已登录 → storage 有 ht_profile，视为"已填写"，高亮展示；否则引导完善
    const hasProfile = !!(auth && wx.getStorageSync(api.STORAGE.PROFILE));

    this.setData({
      loading: false,
      isLoggedIn: !!auth,
      authAccount: auth
        ? {
          name: profile.nickname || auth.userInfo.nickName || '微信用户',
          avatarUrl: profile.avatarUrl || auth.userInfo.avatarUrl || '',
          copy: '微信已登录，身份卡和赛程会同步到当前账号',
        }
        : { name: '未登录', avatarUrl: '', copy: '登录后同步身份卡、赛程、收藏和 Skills 结果' },
      avatarChar,
      activeCount: ongoing,
      savedCount: stats.bookmarks,
      profileCard: {
        filled: hasProfile,
        avatarUrl: profile.avatarUrl || '',
        avatarChar,
        nickname: profile.nickname,
        role: profile.role,
        city: profile.city,
        skills: profile.skills || [],
        skillsText: (profile.skills || []).slice(0, 4).join(' · '),
      },
      profileMode,
      assetStats: [
        { label: '进行中', value: `${ongoing}` },
        { label: '身份卡', value: `${cardsCount}` },
      ],
      organizerStatus: organizer.status,
      organizerStatusText: this.getOrganizerStatusText(organizer.status),
      organizerTools: this.buildOrganizerTools(organizer.status),
      settings: this.buildSettings(!!(adminState && adminState.isAdmin)),
    });
  },

  buildSettings(isAdmin) {
    const list = [
      { title: '账号设置', sub: '登录方式、通知和隐私', url: '/pages/settings/settings' },
      { title: '公开主页', sub: '预览你的 HackerTrip 主页', url: '/pages/public-site/public-site' },
    ];
    if (isAdmin) {
      list.unshift({
        title: '审核工作台',
        sub: '赛事审核、组织者审核和上下线控制',
        url: '/pages/admin-hackathons/admin-hackathons',
      });
    }
    return list;
  },

  async openLogin() {
    if (api.isLoggedIn()) {
      wx.showToast({ title: '微信已登录', icon: 'none' });
      return;
    }
    const modal = this.selectComponent('#authModal');
    if (!modal || !modal.open) return;
    const auth = await modal.open({ reason: '登录后可以同步你的身份卡、赛程、收藏和 Skills 结果。' });
    if (auth) this.load();
  },

  onAuthLogin() {
    this.load();
  },

  getOrganizerStatusText(status) {
    const map = {
      none: '未申请',
      pending: '审核中',
      approved: '已认证',
      rejected: '需修改',
    };
    return map[status] || '未申请';
  },

  buildOrganizerTools(status) {
    if (status === 'approved') {
      return [
        { title: '发布黑客松', sub: '创建赛事信息，提交后进入审核', url: '/pages/hackathon-create/hackathon-create', action: 'open' },
        { title: '赛事管理', sub: '查看已提交赛事和审核状态', url: '/pages/organizer/organizer', action: 'open' },
      ];
    }
    if (status === 'pending') {
      return [
        { title: '组织者申请', sub: '申请已提交，等待审核通过后可发布赛事', url: '/pages/organizer/organizer', action: 'open' },
        { title: '发布黑客松', sub: '需先通过组织者认证', action: 'disabled' },
        { title: '赛事管理', sub: '认证通过后开放', action: 'disabled' },
      ];
    }
    return [
      { title: '申请成为组织者', sub: '认证后可发布黑客松和管理赛事', url: '/pages/organizer/organizer', action: 'open' },
      { title: '发布黑客松', sub: '需先申请并通过组织者认证', action: 'disabled' },
      { title: '赛事管理', sub: '认证通过后开放', action: 'disabled' },
    ];
  },

  switchMode(e) {
    const mode = api.setProfileMode(e.currentTarget.dataset.mode || 'participant');
    this.setData({ profileMode: mode });
  },

  onOrganizerToolTap(e) {
    const item = this.data.organizerTools[e.currentTarget.dataset.index];
    if (!item) return;
    if (item.action === 'disabled') {
      wx.showToast({ title: '需先完成组织者认证', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: item.url });
  },
});
