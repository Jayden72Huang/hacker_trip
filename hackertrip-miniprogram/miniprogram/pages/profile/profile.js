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
    // 卡内数据指标：真实履历数据（参赛场次 / 获奖 / 作品，load 后填真实值），点击可跳转补数据
    assetStats: [
      { label: '参赛场次', value: '—', url: '/pages/achievements/achievements' },
      { label: '获奖', value: '—', url: '/pages/achievements/achievements' },
      { label: '作品', value: '—', url: '/pages/my-works/my-works' },
    ],
    loading: true,
    // 个人资料卡：filled=是否已填写过(决定高亮 or 引导)
    profileCard: { filled: false, avatarUrl: '', avatarChar: 'H', nickname: '', role: '', city: '', skills: [], skillsText: '' },
    profileMode: 'participant',
    organizerStatus: 'none',
    organizerStatusText: '未申请',
    organizerTools: [],
    tools: [
      { title: '我的身份卡', sub: '生成参赛身份卡，分享找队友', url: '/pages/identity/identity' },
      { title: '黑客松旅行', sub: '参赛足迹和获奖记录，凭验证码领取主办方奖杯', url: '/pages/achievements/achievements' },
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
    // 获奖数：从履历缓存里按奖项关键词统计（含主办方奖杯和自述记录）
    const awardCount = api.getLocalAchievements().filter((item) => item
      && /award|win|champion|first|gold|silver|bronze|奖|冠军|亚军|季军|入围|finalist/i.test(`${item.level || ''} ${item.title || ''}`)).length;
    // 昵称/头像：本地档案优先，其次登录时带回的微信资料
    const accountName = profile.nickname || (auth && auth.userInfo && auth.userInfo.nickName) || '';
    const accountAvatar = profile.avatarUrl || (auth && auth.userInfo && auth.userInfo.avatarUrl) || '';
    const avatarChar = (accountName || 'H').trim().charAt(0).toUpperCase() || 'H';
    // 有实际资料内容才算"已填写"（静默登录会创建空档案，不能只看 storage 是否存在）
    const hasProfile = !!(profile.nickname || profile.avatarUrl || profile.role || profile.city || (profile.skills || []).length);

    this.setData({
      loading: false,
      avatarChar,
      activeCount: ongoing,
      savedCount: stats.bookmarks,
      profileCard: {
        filled: hasProfile,
        avatarUrl: accountAvatar,
        avatarChar,
        nickname: accountName,
        role: profile.role,
        city: profile.city,
        skills: profile.skills || [],
        skillsText: (profile.skills || []).slice(0, 4).join(' · '),
      },
      profileMode,
      assetStats: [
        { label: '参赛场次', value: `${regs.length}`, url: '/pages/achievements/achievements' },
        { label: '获奖', value: `${awardCount}`, url: '/pages/achievements/achievements' },
        { label: '作品', value: `${stats.projects}`, url: '/pages/my-works/my-works' },
      ],
      organizerStatus: organizer.status,
      organizerStatusText: this.getOrganizerStatusText(organizer.status),
      organizerTools: this.buildOrganizerTools(organizer.status),
      settings: this.buildSettings(isAdmin),
    });
  },

  /** 后台云端校验：档案/组织者状态同步 + admin 标记，数据有变化才引起重绘 */
  async revalidate() {
    // openid 登录无需用户授权：未登录时后台静默完成，登录成功即自动拉回云端数据
    if (!api.getAuth() && !(await api.silentLogin())) return;
    await api.syncUserDataIfLoggedIn().catch(() => {});
    if (api.cloudReady()) {
      await api.checkHackathonAdmin().catch(() => ({ isAdmin: false }));
      // 刷新履历缓存，供「获奖」指标统计
      await api.listAchievements().catch(() => {});
    }
    this.renderLocal();
  },

  /** 指标点击：跳到对应页面查看/补数据 */
  onStatTap(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
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

  /** 拦截资料卡内头像/昵称的点击冒泡，避免误触进入编辑页 */
  noop() {},

  // 微信头像选择回调：返回临时路径，本地即存即显，后台静默登录 + 上传云存储换 fileID
  async onChooseAvatar(e) {
    const avatarUrl = (e.detail && e.detail.avatarUrl) || '';
    if (!avatarUrl) return;
    const wasLoggedIn = api.isLoggedIn();
    api.saveProfile({ avatarUrl });
    this.renderLocal();
    wx.showToast({ title: '头像已更新', icon: 'none' });
    // 仅在"这次操作触发了首次登录"时刷新云端数据；已登录时 saveProfile 已后台上云，无需再拉取
    if (!wasLoggedIn && (await api.silentLogin(true))) this.revalidate();
  },

  // 昵称输入完成（失焦/确认）：支持键盘上方"使用微信昵称"快捷填入
  async onNicknameChange(e) {
    const nickname = String((e.detail && e.detail.value) || '').trim();
    if (!nickname || nickname === this.data.profileCard.nickname) return;
    const wasLoggedIn = api.isLoggedIn();
    api.saveProfile({ nickname });
    this.renderLocal();
    wx.showToast({ title: '昵称已更新', icon: 'none' });
    if (!wasLoggedIn && (await api.silentLogin(true))) this.revalidate();
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
        { title: '发布奖杯', sub: '按名单批量发电子奖状，选手领取即官方认证', url: '/pages/organizer-verify/organizer-verify', action: 'open' },
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
