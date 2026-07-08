const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');

function buildRows(config, scan) {
  const project = scan && scan.project ? scan.project : {};
  const identity = scan && scan.identity ? scan.identity : {};
  const matches = scan && Array.isArray(scan.matches) ? scan.matches : [];
  const stack = project.techStack || identity.techStack || [];
  return [
    {
      key: 'projectContext',
      name: '项目画像',
      desc: project.name ? `${project.name} · ${project.summary || project.description || '已同步项目简介'}` : '同步后 Haki 可读取项目名称和简介',
      enabled: !!config.projectContext,
      ready: !!(project.name || project.summary || project.description),
    },
    {
      key: 'techStack',
      name: '技术栈',
      desc: stack.length ? stack.slice(0, 6).join('、') : '同步后 Haki 可读取技术栈',
      enabled: !!config.techStack,
      ready: stack.length > 0,
    },
    {
      key: 'identityCard',
      name: '身份卡',
      desc: identity.role ? `角色 ${identity.role} · ${identity.lookingFor || '组队状态未设置'}` : '同步或编辑身份卡后 Haki 可读取角色画像',
      enabled: !!config.identityCard,
      ready: !!identity.role,
    },
    {
      key: 'matchResults',
      name: '赛事匹配',
      desc: matches.length ? `已有 ${matches.length} 个匹配结果` : '同步后 Haki 可读取项目匹配结果',
      enabled: !!config.matchResults,
      ready: matches.length > 0,
    },
  ];
}

Page({
  data: {
    title: 'Haki 授权',
    aiBanner: false,
    aiIntentText: 'agent.skills',
    hasScan: false,
    scanTitle: '未同步项目',
    scanMeta: '先在电脑上同步你的项目能力，Haki 才有依据帮你推荐。',
    rows: [],
    sourceSteps: [],
    savingKey: '',
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'agent.skills',
    });
    this.load();
  },

  onShow() {
    this.load();
  },

  async load() {
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const config = api.getAgentConfig();
    const scan = api.getScanResults();
    const profile = api.getProfile();
    const project = scan && scan.project ? scan.project : {};
    const identity = scan && scan.identity ? scan.identity : {};
    const matches = scan && Array.isArray(scan.matches) ? scan.matches : [];
    this.setData({
      hasScan: !!scan,
      scanTitle: project.name || (scan ? '已同步项目' : '未同步项目'),
      scanMeta: scan
        ? `${project.summary || project.description || '项目画像已同步'}`
        : '先在电脑上同步你的项目能力，Haki 才有依据帮你推荐。',
      rows: buildRows(config, scan),
      sourceSteps: [
        {
          title: '项目能力同步',
          desc: project.name ? `已同步 ${project.name}` : '在电脑上扫描你的项目简介、技术栈和公开作品（代码不上传）',
          ready: !!(project.name || project.summary || project.description),
        },
        {
          title: '身份资料',
          desc: (identity.role || profile.role)
            ? `${identity.role || profile.role}${(identity.city || profile.city) ? ' · ' + (identity.city || profile.city) : ''}`
            : '在身份信息里维护昵称、角色、城市和技能',
          ready: !!(identity.role || profile.role || profile.nickname),
        },
        {
          title: '赛事匹配',
          desc: matches.length ? `已有 ${matches.length} 个匹配结果，Haki 能看到` : '同步或匹配后，Haki 就能看到推荐赛事',
          ready: matches.length > 0,
        },
      ],
    });
  },

  async toggleRow(e) {
    const key = e.currentTarget.dataset.key;
    if (this.data.savingKey) return;
    const auth = await api.requireAuth(this, '/pages/agent/agent', '登录后才能把授权设置同步到你的 HackerTrip 账号。');
    if (!auth) return;
    const current = api.getAgentConfig();
    const prev = Object.assign({}, current);
    this.setData({ savingKey: key });
    api.setAgentConfig({ [key]: !current[key] }, { skipSync: true });
    this.load();
    try {
      const res = await api.saveAgentConfig({ [key]: !current[key] });
      if (!res || !res.ok) throw new Error((res && res.message) || '同步失败');
      wx.showToast({ title: '配置已同步', icon: 'none' });
    } catch (err) {
      api.setAgentConfig(prev, { skipSync: true });
      this.load();
      wx.showToast({ title: '同步失败，请重试', icon: 'none' });
    }
    this.setData({ savingKey: '' });
  },

  goSync() {
    wx.navigateTo({ url: '/pages/sync/sync' });
  },

  goChat() {
    wx.navigateTo({ url: '/pages/chat/chat?intent=agent.context' });
  },

  onAuthLogin() {},
});
