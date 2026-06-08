const { ROLE_MAP } = require('../../utils/roles.js');
const { drawCard, W, H } = require('../../utils/card-canvas.js');

Page({
  data: {
    role: 'zero_to_one',
    variant: 'identity',
    roleMeta: null,
  },

  onLoad(query) {
    const role = ROLE_MAP[query.role] ? query.role : 'zero_to_one';
    this.setData({
      role,
      variant: query.variant === 'config' ? 'config' : 'identity',
      roleMeta: ROLE_MAP[role],
    });
  },

  onReady() {
    const q = wx.createSelectorQuery();
    q.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      drawCard(ctx, {
        variant: this.data.variant,
        role: this.data.role,
        techStack: ['Next.js', 'TypeScript', 'Claude SDK', 'Three.js'],
        aiTools: ['Claude Code', 'Cursor'],
        playStyle: 'solo',
        lookingFor: 'teammate',
        projects: 6,
        hackathons: 4,
        awards: 1,
        secondary: ['zero_to_one', 'pixel_carver'],
      }, dpr);
    });
  },

  makeMine() {
    wx.navigateTo({ url: '/pages/card/card' });
  },
  goExplore() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    const role = this.data.roleMeta || ROLE_MAP.zero_to_one;
    return {
      title: `我在黑客松里是「${role.name}」${role.emoji}，看看你是什么角色`,
      path: `/pages/share/share?role=${this.data.role}&variant=${this.data.variant}`,
    };
  },
});
