const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '编辑身份',
    aiBanner: false,
    aiIntentText: 'identity.edit',
    avatarUrl: '',
    isLoggedIn: false,
    form: {
      nickname: '',
      role: '',
      city: '',
      skills: '', // 表单内用逗号分隔字符串，档案里是数组
      github: '',
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
        nickname: profile.nickname,
        role: profile.role,
        city: profile.city,
        skills: (profile.skills || []).join(', '),
        github: profile.github,
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
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async saveProfile() {
    if (this.data.saving) return;
    const auth = await api.requireAuth(this, '/pages/identity-edit/identity-edit', '登录后才能把身份资料同步到当前微信账号。');
    if (!auth) return;
    const { nickname, role, city, github, skills } = this.data.form;
    const skillList = (skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
    this.setData({ saving: true });
    const payload = {
      nickname,
      role,
      city,
      github,
      avatarUrl: this.data.avatarUrl,
      skills: skillList,
    };

    try {
      const res = await api.saveProfileWithSync(payload);
      this.setData({ saving: false });
      if (!res || !res.ok) {
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
