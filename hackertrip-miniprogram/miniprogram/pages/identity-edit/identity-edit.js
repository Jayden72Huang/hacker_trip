const { parseAIEntry } = require('../../utils/ai.js');
const api = require('../../utils/api.js');

Page({
  data: {
    title: '编辑身份',
    aiBanner: false,
    aiIntentText: 'identity.edit',
    avatarUrl: '',
    form: {
      nickname: '',
      role: '',
      city: '',
      skills: '', // 表单内用逗号分隔字符串，档案里是数组
      github: '',
    },
    saving: false,
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    const profile = api.getProfile();
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'identity.edit',
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

  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl || '' });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async saveProfile() {
    if (this.data.saving) return;
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
      wx.showToast({ title: res.local ? '已保存到本地' : '身份已保存', icon: 'success' });
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
