const catalog = require('../../utils/catalog.js');
const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
const share = require('../../utils/share.js');

function joinText(list) {
  return Array.isArray(list) && list.length ? list.join(' / ') : '待确认';
}

function buildDetail(raw) {
  const item = raw;
  if (!item) return null;
  const logoUrl = item.logoUrl || item.logo || item.icon || '';
  const coverUrl = item.coverUrl || item.cover || item.banner || logoUrl;

  return Object.assign({}, item, {
    dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
    cityText: item.city || item.location || '待确认',
    locationText: item.location || item.city || '待确认',
    logoUrl,
    coverUrl,
    prizeText: item.prizePool || '待确认',
    tracksText: joinText(item.tracks),
    stackText: joinText(item.techStack),
    tagsText: joinText(item.tags),
    deadlineText: item.registrationDeadline || item.startDate || '待确认',
  });
}

Page({
  data: {
    title: '黑客松详情',
    aiBanner: false,
    aiIntentText: '赛事详情',
    item: null,
    metaRows: [],
    loading: true,
    bookmarked: false,
    heat: { heat: 0, fans: 0, registrations: 0, bookmarks: 0, pct: 0, empty: true }, // F3 赛事热度
    notFound: false,
  },

  async onLoad(options) {
    share.enableShareMenu();
    const ai = parseAIEntry(options);
    const key = options.id || options.slug;
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || '赛事详情',
      loading: true,
    });

    // 实时从云函数拉取详情（失败时 api 内部已降级本地）
    let raw = null;
    try {
      raw = await api.getHackathonDetail(key);
    } catch (e) {
      raw = null;
    }
    const item = buildDetail(raw);
    if (!item) {
      this.setData({
        loading: false,
        item: null,
        notFound: true,
        metaRows: [],
      });
      return;
    }

    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});

    this.setData({
      loading: false,
      item,
      notFound: false,
      bookmarked: api.isBookmarked(item.id),
      metaRows: [
        { label: '名称', value: item.name },
        { label: '日期', value: item.dateText },
        { label: '城市', value: item.cityText },
        { label: '形式', value: item.modeText },
        { label: '奖金', value: item.prizeText },
        { label: '报名截止', value: item.deadlineText },
        { label: '赛道', value: item.tracksText },
        { label: '技术栈', value: item.stackText },
        { label: '官网', value: item.website || '待确认' },
      ],
    });
    this.loadHeat(item.id);
  },

  async loadHeat(id) {
    if (!id) return;
    try {
      const res = await api.getHackathonHeat(id);
      if (res && res.ok) {
        // pct：相对一个软上限(300)的进度条，纯视觉，封顶 100
        const pct = Math.max(6, Math.min(100, Math.round((res.heat / 300) * 100)));
        const empty = (res.fans || 0) === 0; // 0 热度 → 走「新赛事·抢先关注」鼓励态，避免冷启动一排 0
        this.setData({ heat: { heat: res.heat, fans: res.fans, registrations: res.registrations, bookmarks: res.bookmarks, pct, empty } });
      }
    } catch (e) { /* 热度失败不阻断详情 */ }
  },

  // 主办方一键认领：引导进入组织者认领/申请流（B 端获客入口）
  claimHackathon() {
    const item = this.data.item || {};
    wx.showModal({
      title: '认领这场赛事',
      content: `「${item.name || '该赛事'}」已有 ${this.data.heat.fans} 位开发者关注。认领后可查看完整选手画像、补全赛事信息并获得官方曝光位。`,
      confirmText: '去认领',
      cancelText: '再看看',
      success: (r) => {
        if (r.confirm) wx.navigateTo({ url: '/pages/organizer/organizer?claim=' + encodeURIComponent(item.id || '') });
      },
    });
  },

  async joinSchedule() {
    const auth = await api.requireAuth(
      this,
      '/pages/detail/detail?id=' + (this.data.item && this.data.item.id || ''),
      '登录后才能把比赛保存到你的赛程，并在「赛程」Tab 中同步查看。',
    );
    if (!auth) return;
    const item = this.data.item;
    if (!item) return;
    await api.syncUserDataIfLoggedIn().catch(() => {});
    const already = api.getRegistrations().some((r) => r.id === item.id);
    if (already) {
      this.showScheduleSuccess();
      return;
    }
    await api.addRegistration(item);
    this.showScheduleSuccess();
  },

  showScheduleSuccess() {
    wx.showToast({
      title: '赛程加入成功,可以到赛程页面查看赛事行程',
      icon: 'none',
      duration: 3000,
    });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/schedule/schedule' });
    }, 3000);
  },

  async toggleBookmark() {
    const item = this.data.item;
    if (!item || !item.id) return;
    const auth = await api.requireAuth(
      this,
      '/pages/detail/detail?id=' + item.id,
      '登录后才能收藏赛事，并在「赛程」Tab 中同步查看。',
    );
    if (!auth) return;
    try {
      const active = await api.toggleBookmark(item.id);
      this.setData({ bookmarked: active });
      wx.showToast({ title: active ? '已收藏' : '已取消收藏', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: '收藏同步失败，请重试', icon: 'none' });
    }
  },

  askAI() {
    const item = this.data.item || {};
    wx.navigateTo({
      url: `/pages/chat/chat?id=${item.id || ''}&intent=event.fit`,
    });
  },

  // 复制官网报名链接到剪贴板（替代 web-view 加载外部域名，规避业务域名校验）
  copyOfficialUrl() {
    const item = this.data.item;
    if (!item) {
      wx.showToast({ title: '暂无可复制内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: share.copyShareText(item),
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'none' });
      },
    });
  },

  onShareAppMessage() {
    const item = this.data.item || {};
    return share.buildDetailShare(item);
  },

  onShareTimeline() {
    return share.timelinePayload(share.buildDetailShare(this.data.item || {}));
  },
});
