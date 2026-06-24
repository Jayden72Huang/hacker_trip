const catalog = require('../../utils/catalog.js');
const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

function joinText(list) {
  return Array.isArray(list) && list.length ? list.join(' / ') : '待确认';
}

function buildDetail(raw) {
  const fallback = catalog.getAll({ includeEnded: true })[0];
  const item = raw || fallback;

  return Object.assign({}, item, {
    dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
    cityText: item.city || item.location || '待确认',
    locationText: item.location || item.city || '待确认',
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
  },

  async onLoad(options) {
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

    this.setData({
      loading: false,
      item,
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
  },

  joinSchedule() {
    if (!api.requireAuth('/pages/detail/detail?id=' + (this.data.item && this.data.item.id || ''))) return;
    const item = this.data.item;
    if (!item) return;
    const already = api.getRegistrations().some((r) => r.id === item.id);
    if (already) {
      wx.showToast({ title: '已在你的赛程中', icon: 'none' });
      return;
    }
    api.addRegistration(item);
    wx.showToast({ title: '已加入赛程', icon: 'success' });
  },

  askAI() {
    const item = this.data.item || {};
    wx.navigateTo({
      url: `/pages/chat/chat?id=${item.id || ''}&intent=event.fit`,
    });
  },

  // 复制官网报名链接到剪贴板（替代 web-view 加载外部域名，规避业务域名校验）
  copyOfficialUrl() {
    const url = this.data.item && this.data.item.website;
    if (!url) {
      wx.showToast({ title: '暂无官网链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制，去浏览器打开', icon: 'none' });
      },
    });
  },

  onShareAppMessage() {
    const item = this.data.item || {};
    return {
      title: item.name ? `${item.name} · ${item.dateText || ''}` : 'HackerTrip 黑客松',
      path: `/pages/detail/detail?id=${item.id || ''}`,
    };
  },
});
