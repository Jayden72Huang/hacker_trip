const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

/** github 字段兼容用户名和完整链接两种填法，派生出展示名和可复制链接 */
function githubMeta(raw) {
  const value = String(raw || '').trim().replace(/^@/, '');
  if (!value) return { githubUrl: '', githubName: '' };
  const githubUrl = /^https?:\/\//i.test(value) ? value : `https://github.com/${value}`;
  const githubName = githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '') || value;
  return { githubUrl, githubName };
}

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
    projects: [],
    works: [],
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
          profile: Object.assign({}, remote.profile, { avatarChar }, githubMeta(remote.profile.github)),
          projects: remote.projects || [],
          works: (remote.works || []).map((work) => Object.assign({}, work, {
            tags: Array.isArray(work.tags) ? work.tags : [],
          })),
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

    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const p = api.getProfile();
    const stats = api.getUserStats();
    const avatarChar = (p.nickname || 'H').trim().charAt(0).toUpperCase() || 'H';

    const regs = api.getRegistrations();
    let history = [];
    try {
      const joined = await Promise.all(
        regs.map(async (reg) => (await api.getHackathonDetail(reg.id)) || reg),
      );
      history = joined.map((item) => ({
        id: item.id,
        name: item.name,
        dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
        cityText: item.city || item.location || '待确认',
        modeText: item.modeText,
      }));
    } catch (err) {
      history = regs.map((item) => ({
        id: item.id,
        name: item.name,
        dateText: `${item.startDate || '待确认'} - ${item.endDate || '待确认'}`,
        cityText: item.city || item.location || '待确认',
        modeText: item.modeText,
      }));
    }

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
        githubUrl: githubMeta(p.github).githubUrl,
        githubName: githubMeta(p.github).githubName,
        stats: { hackathons: stats.hackathons, projects: stats.projects, skills: stats.skills },
        skills: p.skills || [],
      },
      projects: api.getPortfolioProjects(),
      works: [],
      history,
    });
  },

  copyWorkLink(e) {
    const url = e.currentTarget.dataset.url || '';
    if (!url) {
      wx.showToast({ title: '暂无链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' }),
    });
  },
});
