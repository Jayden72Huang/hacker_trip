const api = require('../../utils/api.js');
const { decideRole, ROLE_MAP, countTechCategories } = require('../../utils/roles.js');
const { buildCardbook } = require('../../utils/unlocks.js');

Page({
  data: {
    title: '卡册',
    role: null, // 当前主角色卡
    cards: [],
    unlockedCount: 0,
    total: 0,
    recruitScore: 0,
  },

  onShow() {
    if (api.isLoggedIn()) api.syncUserDataIfLoggedIn().catch(() => {});
    this.refresh();
  },

  refresh() {
    const profile = api.getProfile();
    const stats = api.getUserStats();
    const growth = api.getGrowth();
    const scan = api.getScanResults();

    // 当前主角色（由技术栈判定，与身份卡一致）
    const result = decideRole({ techStack: profile.skills || [], projectCount: stats.projects });
    const role = ROLE_MAP[result.primary] || ROLE_MAP.zero_to_one;

    const book = buildCardbook({
      stats: { hackathons: stats.hackathons },
      techCategoryCount: countTechCategories((profile.skills || []).map((s) => String(s).toLowerCase())),
      serverUnlocked: growth.unlockedCards || [],
      hasSync: !!(scan && scan.syncedAt),
    });

    this.setData({
      role: { name: role.name, emoji: role.emoji, tagline: role.tagline },
      cards: book.cards,
      unlockedCount: book.unlockedCount,
      total: book.total,
      recruitScore: growth.recruitScore || 0,
    });
  },

  goIdentity() {
    wx.navigateTo({ url: '/pages/identity/identity' });
  },

  goChat() {
    wx.navigateTo({ url: '/pages/chat/chat' });
  },

  // 点未解锁卡 → 提示解锁方式
  tapCard(e) {
    const card = this.data.cards[e.currentTarget.dataset.idx];
    if (!card) return;
    if (card.unlocked) {
      wx.showToast({ title: `已解锁 · ${card.name}`, icon: 'none' });
    } else {
      wx.showModal({
        title: `${card.emoji} ${card.name}（未解锁）`,
        content: card.cond,
        confirmText: card.source === 'server' ? '去要暗号' : '去看赛事',
        cancelText: '知道了',
        success: (r) => {
          if (!r.confirm) return;
          if (card.source === 'server') this.goIdentity();
          else wx.switchTab({ url: '/pages/discover/discover' });
        },
      });
    }
  },
});
