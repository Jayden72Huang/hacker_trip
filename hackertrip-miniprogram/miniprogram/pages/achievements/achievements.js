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
  const isAward = /award|win|champion|first|gold|silver|bronze|奖|冠军|亚军|季军|入围|finalist/i.test(`${level} ${item.title || ''}`);
  const verified = item.verified === true;
  return Object.assign({}, item, {
    isAward,
    verified,
    levelText: item.title || '参赛记录',
    byText: verified ? (item.verifiedByName || 'HackerTrip 主办方') : '本人添加',
    eventText: item.eventName || item.eventId || '',
    productUrl: item.productUrl || '',
    imageFileId: item.imageFileId || '',
  });
}

const LEVEL_OPTIONS = [
  { label: '已参赛', value: 'participant' },
  { label: '入围', value: 'finalist' },
  { label: '获奖', value: 'award' },
];

Page({
  data: {
    title: '黑客松旅行',
    loading: true,
    isLoggedIn: false,
    stops: [],
    extras: [],
    stats: { total: 0, awards: 0, verified: 0 },
    // 领取奖杯 / 添加履历 折叠面板
    activePanel: '',
    claimForm: { name: '', eventName: '', code: '' },
    claiming: false,
    levelLabels: LEVEL_OPTIONS.map((item) => item.label),
    addForm: { eventName: '', title: '', levelIndex: 2, productUrl: '' },
    addImage: '',
    adding: false,
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

  /* ---------------- 领取奖杯 / 添加履历 ---------------- */

  async togglePanel(e) {
    const panel = e.currentTarget.dataset.panel || '';
    if (!api.isLoggedIn()) {
      await this.openLogin();
      if (!api.isLoggedIn()) return;
    }
    if (this.data.activePanel === panel) {
      this.setData({ activePanel: '' });
      return;
    }
    const patch = { activePanel: panel };
    // 领奖姓名预填档案昵称（兜底登录微信昵称），主办方多按真名登记，用户可改
    if (panel === 'claim' && !this.data.claimForm.name) {
      const auth = api.getAuth();
      patch['claimForm.name'] = api.getProfile().nickname
        || (auth && auth.userInfo && auth.userInfo.nickName) || '';
    }
    this.setData(patch);
  },

  onClaimInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`claimForm.${field}`]: e.detail.value });
  },

  async submitClaim() {
    if (this.data.claiming) return;
    const { name, eventName, code } = this.data.claimForm;
    if (!name.trim() || !code.trim()) {
      wx.showToast({ title: '请填写姓名和验证码', icon: 'none' });
      return;
    }
    this.setData({ claiming: true });
    const res = await api.claimCertificate(name.trim(), code.trim(), eventName.trim());
    this.setData({ claiming: false });
    if (!res || !res.ok) {
      wx.showModal({ title: '领取失败', content: (res && res.message) || '请稍后重试', showCancel: false });
      return;
    }
    this.setData({ activePanel: '', 'claimForm.code': '' });
    const ach = res.achievement || {};
    wx.showModal({
      title: '奖杯已入册 🏆',
      content: `「${ach.eventName || '赛事'} · ${ach.title || '获奖记录'}」已绑定到你的账号，标记为官方认证 ✓。`,
      showCancel: false,
    });
    this.renderLocal();
    this.revalidate();
  },

  onAddInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`addForm.${field}`]: e.detail.value });
  },

  onAddLevelChange(e) {
    this.setData({ 'addForm.levelIndex': Number(e.detail.value) || 0 });
  },

  async chooseAddImage() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] });
      const file = res && res.tempFiles && res.tempFiles[0];
      if (file && file.tempFilePath) this.setData({ addImage: file.tempFilePath });
    } catch (e) { /* 用户取消 */ }
  },

  removeAddImage() {
    this.setData({ addImage: '' });
  },

  async submitAdd() {
    if (this.data.adding) return;
    const form = this.data.addForm;
    if (!form.eventName.trim() || !form.title.trim()) {
      wx.showToast({ title: '请填写赛事名称和奖项/结果', icon: 'none' });
      return;
    }
    this.setData({ adding: true });
    let imageFileId = '';
    if (this.data.addImage) {
      imageFileId = await api.uploadAchievementImage(this.data.addImage);
      if (!imageFileId) {
        this.setData({ adding: false });
        wx.showToast({ title: '截图上传失败，请重试', icon: 'none' });
        return;
      }
    }
    const level = (LEVEL_OPTIONS[form.levelIndex] || LEVEL_OPTIONS[0]).value;
    const res = await api.addSelfAchievement({
      eventName: form.eventName.trim(),
      title: form.title.trim(),
      level,
      productUrl: form.productUrl.trim(),
      imageFileId,
    });
    this.setData({ adding: false });
    if (!res || !res.ok) {
      wx.showModal({ title: '添加失败', content: (res && res.message) || '请稍后重试', showCancel: false });
      return;
    }
    this.setData({
      activePanel: '',
      addForm: { eventName: '', title: '', levelIndex: 2, productUrl: '' },
      addImage: '',
    });
    wx.showToast({ title: '履历已添加', icon: 'success' });
    this.renderLocal();
    this.revalidate();
  },

  previewProof(e) {
    const src = e.currentTarget.dataset.src;
    if (src) wx.previewImage({ urls: [src] });
  },

  copyProductUrl(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) });
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
