const { parseAIEntry } = require('../../utils/ai.js');
const { ROLE_MAP } = require('../../utils/roles.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '分享落地',
    aiBanner: false,
    aiIntentText: 'share',
    role: {
      name: '黑客松选手',
      emoji: 'H',
      tagline: '生成身份卡后展示你的角色定位',
    },
    uid: '',
    roleKey: '',
    profileName: '',
    profileMeta: '',
    // stats / skills 在 onLoad 用真实资产统计 + 统一档案填充
    stats: { hackathons: 0, projects: 0, skills: 0 },
    skills: [],
  },

  getUidFromOptions(options) {
    if (options && options.uid) return String(options.uid);
    if (!options || !options.scene) return '';
    const scene = decodeURIComponent(options.scene);
    const pairs = scene.split('&');
    for (let i = 0; i < pairs.length; i += 1) {
      const parts = pairs[i].split('=');
      if (parts[0] === 'uid') return parts.slice(1).join('=');
    }
    return '';
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    const roleKey = (options && options.role) || 'zero_to_one';
    const role = ROLE_MAP[roleKey] || this.data.role;
    const uid = this.getUidFromOptions(options || {});
    if (uid) {
      const remote = await api.getPublicProfile(uid);
      if (remote && remote.ok && remote.profile) {
        const p = remote.profile;
        this.setData({
          aiBanner: ai.fromAI,
          aiIntentText: ai.intent || 'share',
          role,
          uid,
          roleKey,
          profileName: p.name || '',
          profileMeta: [p.role, p.city].filter(Boolean).join(' · '),
          stats: p.stats || { hackathons: 0, projects: 0, skills: 0 },
          skills: p.skills || [],
        });
        return;
      }
    }

    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const stats = api.getUserStats();
    const profile = api.getProfile();
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'share',
      role,
      uid,
      roleKey,
      profileName: profile.nickname || '',
      profileMeta: [profile.role, profile.city].filter(Boolean).join(' · '),
      stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
      skills: profile.skills || [],
    });
  },

  generateCard() {
    wx.navigateTo({ url: '/pages/identity/identity' });
  },

  openPublicSite() {
    if (!this.data.uid) return;
    wx.navigateTo({ url: `/pages/public-site/public-site?uid=${this.data.uid}` });
  },

  onShareAppMessage() {
    const params = [`role=${encodeURIComponent(this.data.roleKey || 'zero_to_one')}`];
    if (this.data.uid) params.push(`uid=${encodeURIComponent(this.data.uid)}`);
    return {
      title: `我在 HackerTrip 的黑客松身份：${this.data.role.name}`,
      path: `/pages/share/share?${params.join('&')}`,
    };
  },
});
