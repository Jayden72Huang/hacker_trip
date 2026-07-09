const api = require('../../utils/api.js');
const catalog = require('../../utils/catalog.js');
const { parseAIEntry } = require('../../utils/ai.js');
const share = require('../../utils/share.js');

Page({
  data: {
    title: '我的',
    aiBanner: false,
    aiIntentText: '个人中心',
    avatarChar: 'H',
    activeCount: 0,
    savedCount: 0,
    // 卡内数据指标：真实履历数据（进行中赛事 / Skills 数 / 验证履历数，load 后填真实值）
    assetStats: [
      { label: '进行中', value: '—' },
      { label: 'Skills', value: '—' },
      { label: '验证履历', value: '—' },
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
      { title: '黑客松旅行', sub: '走过的比赛和获奖记录，可获主办方官方认证', url: '/pages/achievements/achievements' },
      { title: '我的项目 / 作品', sub: '同步项目画像，管理提交作品', url: '/pages/my-works/my-works' },
      { title: '报名资料模板', sub: '用资料库一键拼出报名草稿和缺失项', url: '/pages/form-assistant/form-assistant' },
    ],
    moreTools: [
      { title: '项目能力同步', sub: '把项目和技能同步给 AI 助手 Haki，赛事推荐更准', url: '/pages/agent/agent' },
      { title: '卡册 · 成就解锁', sub: '查看已解锁的限定卡面', url: '/pages/cardbook/cardbook' },
    ],
    settings: [],
  },

  onShow() {
    share.enableShareMenu();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    // 本地缓存立即渲染（无闪烁），云端校验放后台
    this.renderLocal();
    this.revalidate();
  },

  onLoad(options) {
    share.enableShareMenu();
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: !!ai.fromAI,
      aiIntentText: ai.intent || '个人中心',
    });
    // 渲染统一在 onShow 里做（onLoad 后必触发 onShow）
  },

  /** 只读本地 storage 的同步渲染，进页面即出，不等云端 */
  renderLocal() {
    const auth = api.getAuth();
    const stats = api.getUserStats();
    const profile = api.getProfile();
    const profileMode = api.getProfileMode();
    const organizer = api.getOrganizerApplication();
    const isAdmin = api.getCachedAdminFlag();
    // 进行中赛事数：优先用缓存的赛事列表，缓存未命中时按报名快照的日期重新派生 status
    const today = catalog.formatDate(new Date());
    const regs = api.getRegistrations();
    const cachedEvents = api.getCachedHackathons({ includeEnded: true });
    const ongoing = regs.filter((reg) => {
      const latest = cachedEvents.find((h) => h.id === reg.id) || catalog.decorate(reg, today);
      return latest && latest.status === 'ongoing';
    }).length;
    const avatarChar = (profile.nickname || 'H').trim().charAt(0).toUpperCase() || 'H';
    // 编辑过资料 或 已登录 → storage 有 ht_profile，视为"已填写"，高亮展示；否则引导完善
    const hasProfile = !!(auth && wx.getStorageSync(api.STORAGE.PROFILE));

    const accountName = profile.nickname || (auth && auth.userInfo.nickName) || '';
    const accountAvatar = profile.avatarUrl || (auth && auth.userInfo.avatarUrl) || '';
    // 微信平台已不提供静默获取昵称头像，登录后没设置的引导用户点卡片补全
    const needsProfile = !!auth && (!accountName || !accountAvatar);

    this.setData({
      loading: false,
      isLoggedIn: !!auth,
      needsProfile,
      authAccount: auth
        ? {
          name: accountName || '还没设置昵称',
          avatarUrl: accountAvatar,
          copy: needsProfile
            ? '点这里设置微信头像和昵称 →'
            : '微信已登录，身份卡和赛程会同步到当前账号',
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
        { label: 'Skills', value: `${(profile.skills || []).length}` },
        { label: '验证履历', value: this._achievementCount != null ? `${this._achievementCount}` : '—' },
      ],
      organizerStatus: organizer.status,
      organizerStatusText: this.getOrganizerStatusText(organizer.status),
      organizerTools: this.buildOrganizerTools(organizer.status),
      settings: this.buildSettings(isAdmin),
    });
  },

  /** 后台云端校验：档案/组织者状态同步 + admin 标记，数据有变化才引起重绘 */
  async revalidate() {
    if (!api.getAuth()) return;
    await api.syncUserDataIfLoggedIn().catch(() => {});
    if (api.cloudReady()) {
      await api.checkHackathonAdmin().catch(() => ({ isAdmin: false }));
      // 主办方验证的履历数（可信履历指标）
      try {
        const res = await api.listAchievements();
        if (res && Array.isArray(res.achievements)) this._achievementCount = res.achievements.length;
      } catch (e) { /* 拉不到保持 — */ }
    }
    this.renderLocal();
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
    if (auth) {
      this.renderLocal();
      this.revalidate();
    }
  },

  onAuthLogin() {
    this.renderLocal();
    this.revalidate();
  },

  // 已登录但没设置头像昵称：点账号卡去补全
  onAccountCardTap() {
    if (!this.data.isLoggedIn || !this.data.needsProfile) return;
    wx.navigateTo({ url: '/pages/identity-edit/identity-edit' });
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
        { title: '验证选手履历', sub: '给参赛、入围和获奖结果加主办方验证', url: '/pages/organizer-verify/organizer-verify', action: 'open' },
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

  onShareAppMessage() {
    return share.buildProfileShare();
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildProfileShare());
  },
});
