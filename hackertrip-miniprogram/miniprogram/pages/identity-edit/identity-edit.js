const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

function normalizeText(value) {
  return String(value || '')
    .replace(/&amp;#10;|&#10;|&#x0a;|&#x0A;|&NewLine;/g, '\n')
    .replace(/\r\n?/g, '\n');
}

Page({
  data: {
    title: '编辑身份',
    aiBanner: false,
    aiIntentText: 'identity.edit',
    projectsPlaceholder: 'AI 视频工作流\n黑客松项目身份卡',
    experiencesPlaceholder: '参加过 8 场黑客松\n负责过 AI Agent 产品原型',
    awardsPlaceholder: '某某黑客松冠军\n最佳 AI 应用奖',
    avatarUrl: '',
    isLoggedIn: false,
    form: {
      nickname: '',
      role: '',
      city: '',
      bio: '',
      skills: '', // 表单内用逗号分隔字符串，档案里是数组
      github: '',
      projectIdea: '',
      lookingFor: '',
      availability: '',
      projectsText: '',
      experiencesText: '',
      awardsText: '',
    },
    saving: false,
  },

  async onLoad(options) {
    const ai = parseAIEntry(options);
    if (api.isLoggedIn()) await api.syncUserDataIfLoggedIn().catch(() => {});
    const profile = api.getProfile();
    const auth = api.getAuth();
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'identity.edit',
      isLoggedIn: !!auth,
      avatarUrl: profile.avatarUrl || '',
      form: {
        nickname: normalizeText(profile.nickname),
        role: normalizeText(profile.role),
        city: normalizeText(profile.city),
        bio: normalizeText(profile.bio),
        skills: (profile.skills || []).join(', '),
        github: normalizeText(profile.github),
        projectIdea: normalizeText((profile.teamPreference && profile.teamPreference.projectIdea) || ''),
        lookingFor: ((profile.teamPreference && profile.teamPreference.lookingFor) || []).join(', '),
        availability: normalizeText((profile.teamPreference && profile.teamPreference.availability) || ''),
        projectsText: normalizeText((profile.projects || []).map((item) => item.name || item.summary || '').filter(Boolean).join('\n')),
        experiencesText: normalizeText((profile.experiences || []).map((item) => item.title || item.summary || '').filter(Boolean).join('\n')),
        awardsText: normalizeText((profile.awards || []).map((item) => item.title || item.eventName || '').filter(Boolean).join('\n')),
      },
    });
  },

  async openLogin() {
    const modal = this.selectComponent('#authModal');
    if (!modal || !modal.open) return;
    const auth = await modal.open({ reason: '登录后会把微信昵称和头像同步到身份卡资料。' });
    if (auth) this.applyAuthProfile(auth);
  },

  onAuthLogin(e) {
    this.applyAuthProfile(e.detail);
  },

  applyAuthProfile(auth) {
    const userInfo = auth && auth.userInfo ? auth.userInfo : {};
    const profile = api.getProfile();
    this.setData({
      isLoggedIn: true,
      avatarUrl: profile.avatarUrl || userInfo.avatarUrl || this.data.avatarUrl,
      'form.nickname': profile.nickname || userInfo.nickName || this.data.form.nickname,
    });
  },

  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl || '' });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: normalizeText(e.detail.value) });
  },

  splitList(text) {
    return normalizeText(text)
      .split(/[,\n，、\/]/)
      .map((s) => s.trim())
      .filter((s) => s);
  },

  splitLines(text, key) {
    return normalizeText(text)
      .split(/\n/)
      .map((s) => s.trim())
      .filter((s) => s)
      .slice(0, 20)
      .map((value) => ({ [key]: value }));
  },

  async saveProfile() {
    if (this.data.saving) return;
    const auth = await api.requireAuth(this, '/pages/identity-edit/identity-edit', '登录后才能把身份资料同步到当前微信账号。');
    if (!auth) return;
    const {
      nickname,
      role,
      city,
      bio,
      github,
      skills,
      projectIdea,
      lookingFor,
      availability,
      projectsText,
      experiencesText,
      awardsText,
    } = this.data.form;
    const skillList = this.splitList(skills);
    this.setData({ saving: true });
    const payload = {
      nickname,
      role,
      city,
      bio,
      github,
      avatarUrl: this.data.avatarUrl,
      skills: skillList,
      projects: this.splitLines(projectsText, 'name'),
      experiences: this.splitLines(experiencesText, 'title'),
      awards: this.splitLines(awardsText, 'title'),
      teamPreference: {
        projectIdea,
        lookingFor: this.splitList(lookingFor),
        availability,
        openToMeet: true,
      },
    };

    try {
      const res = await api.saveProfileWithSync(payload);
      this.setData({ saving: false });
      if (!res || !res.ok) {
        // 云端同步失败但本地已保存：不打断用户，后台会自动重试
        if (res && res.localSaved) {
          wx.showToast({ title: '已保存，云端同步稍后自动重试', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 900);
          return;
        }
        wx.showModal({
          title: '保存失败',
          content: (res && res.message) || '身份资料暂时无法保存，请稍后重试',
          showCancel: false,
        });
        return;
      }
      wx.showToast({ title: '身份已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (e) {
      this.setData({ saving: false });
      wx.showModal({
        title: '保存失败',
        content: '身份资料暂时无法保存，请稍后重试',
        showCancel: false,
      });
    }
  },
});
