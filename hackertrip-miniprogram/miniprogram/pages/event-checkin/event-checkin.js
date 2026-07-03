const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

function parseScene(options) {
  if (options && (options.eventId || options.id)) return String(options.eventId || options.id);
  if (!options || !options.scene) return '';
  const scene = decodeURIComponent(options.scene);
  const pairs = scene.split('&');
  for (let i = 0; i < pairs.length; i += 1) {
    const parts = pairs[i].split('=');
    if (parts[0] === 'event_id' || parts[0] === 'eventId' || parts[0] === 'id') {
      return parts.slice(1).join('=');
    }
  }
  return '';
}

function joinList(value) {
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

function splitList(value) {
  return String(value || '')
    .split(/[,\n，、\/]/)
    .map((item) => item.trim())
    .filter((item) => item);
}

Page({
  data: {
    title: '现场签到',
    aiBanner: false,
    aiIntentText: 'event.checkin',
    eventId: '',
    event: null,
    checkedIn: false,
    loading: true,
    saving: false,
    form: {
      displayName: '',
      role: '',
      city: '',
      skillsText: '',
      projectIdea: '',
      lookingForText: '',
      availability: '',
      openToMeet: true,
      contactHint: '',
    },
  },

  async onLoad(options) {
    const ai = parseAIEntry(options || {});
    const eventId = parseScene(options || {});
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'event.checkin',
      eventId,
    });
    await this.load();
  },

  async load() {
    const eventId = this.data.eventId;
    if (!eventId) {
      this.setData({ loading: false });
      return;
    }
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const profile = api.getProfile();
    const pref = profile.teamPreference || {};
    const res = await api.getEventProfile(eventId);
    const eventProfile = res && res.eventProfile ? res.eventProfile : null;
    const source = eventProfile || {};
    this.setData({
      loading: false,
      event: res && res.event ? res.event : null,
      checkedIn: !!(res && res.checkedIn),
      form: {
        displayName: source.displayName || profile.nickname || '',
        role: source.role || profile.role || '参赛者',
        city: source.city || profile.city || '',
        skillsText: joinList(source.skills && source.skills.length ? source.skills : profile.skills),
        projectIdea: source.projectIdea || pref.projectIdea || '',
        lookingForText: joinList(source.lookingFor && source.lookingFor.length ? source.lookingFor : pref.lookingFor),
        availability: source.availability || pref.availability || '',
        openToMeet: source.openToMeet !== false,
        contactHint: source.contactHint || '',
      },
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onOpenToMeetChange(e) {
    this.setData({ 'form.openToMeet': !!e.detail.value });
  },

  buildPayload() {
    const form = this.data.form;
    return {
      displayName: form.displayName,
      role: form.role,
      city: form.city,
      skills: splitList(form.skillsText),
      projectIdea: form.projectIdea,
      lookingFor: splitList(form.lookingForText),
      availability: form.availability,
      openToMeet: form.openToMeet,
      contactHint: form.contactHint,
    };
  },

  async ensureAuth() {
    return api.requireAuth(
      this,
      '/pages/event-checkin/event-checkin?id=' + this.data.eventId,
      '登录后才能完成活动签到，并生成你的现场身份页。',
    );
  },

  async checkin() {
    if (this.data.saving) return;
    const auth = await this.ensureAuth();
    if (!auth) return;
    this.setData({ saving: true });
    const res = await api.checkinEvent(this.data.eventId, this.buildPayload());
    this.setData({ saving: false });
    if (!res || !res.ok) {
      wx.showModal({ title: '签到失败', content: (res && res.message) || '请稍后重试', showCancel: false });
      return;
    }
    wx.showToast({ title: '已签到', icon: 'success' });
    await this.load();
  },

  async saveProfile() {
    if (this.data.saving) return;
    const auth = await this.ensureAuth();
    if (!auth) return;
    this.setData({ saving: true });
    const res = await api.saveEventProfile(this.data.eventId, this.buildPayload());
    this.setData({ saving: false });
    if (!res || !res.ok) {
      wx.showToast({ title: (res && res.message) || '保存失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  goMembers() {
    wx.navigateTo({ url: '/pages/event-members/event-members?id=' + this.data.eventId });
  },

  goTeamBuilder() {
    wx.navigateTo({ url: '/pages/team-builder/team-builder?id=' + this.data.eventId });
  },

  goDetail() {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + this.data.eventId });
  },
});
