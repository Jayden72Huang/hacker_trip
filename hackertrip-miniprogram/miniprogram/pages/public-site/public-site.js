const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '公开主页',
    aiBanner: false,
    aiIntentText: 'public.site',
    loadError: '',
    // profile 在 onLoad 用统一档案 + 真实资产统计组装（name 映射自档案 nickname）
    profile: {
      uid: '',
      name: '',
      role: '',
      city: '',
      bio: '',
      avatarUrl: '',
      avatarChar: 'H',
      github: '',
      stats: { hackathons: 0, projects: 0, skills: 0 },
      skills: [],
    },
    projects: [
      { name: 'Haki Match Agent', desc: '项目技术栈到黑客松赛道的匹配助手。' },
      { name: 'Pitch Deck Copilot', desc: '自动整理报名材料和路演摘要。' },
    ],
    history: [],
    loading: true,
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
    const uid = this.getUidFromOptions(options || {});
    if (uid) {
      const remote = await api.getPublicProfile(uid);
      if (remote && remote.ok && remote.profile) {
        const avatarChar = (remote.profile.name || 'H').trim().charAt(0).toUpperCase() || 'H';
        this.setData({
          aiBanner: ai.fromAI,
          aiIntentText: ai.intent || 'public.site',
          loading: false,
          profile: Object.assign({}, remote.profile, { avatarChar }),
          projects: remote.projects && remote.projects.length ? remote.projects : this.data.projects,
          history: [],
        });
        return;
      }
      this.setData({
        aiBanner: ai.fromAI,
        aiIntentText: ai.intent || 'public.site',
        loading: false,
        loadError: (remote && remote.message) || '公开主页暂时不可用',
      });
      return;
    }

    const p = api.getProfile();
    const stats = api.getUserStats();
    const avatarChar = (p.nickname || 'H').trim().charAt(0).toUpperCase() || 'H';

    let all = [];
    try {
      all = await api.getHackathons({ includeEnded: true });
    } catch (err) {
      all = [];
    }
    const history = all.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
      cityText: item.city || item.location || '待确认',
      modeText: item.modeText,
    }));

    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'public.site',
      loading: false,
      profile: {
        uid: p.publicId || '',
        name: p.nickname, // wxml 用 profile.name，档案字段是 nickname
        role: p.role,
        city: p.city,
        bio: p.bio,
        avatarUrl: p.avatarUrl,
        avatarChar,
        github: p.github,
        stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
        skills: p.skills || [],
      },
      history,
    });
  },
});
