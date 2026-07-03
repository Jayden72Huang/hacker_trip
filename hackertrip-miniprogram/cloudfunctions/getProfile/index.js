// 云函数：拉取当前用户的卡片 / 收藏 / 报名清单 / 同步状态
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) {
    return { ok: false, message: '缺少用户身份', cards: [], bookmarkIds: [], registrations: [], scan: null };
  }
  try {
    const [cards, bookmarks, regs, pairs, users] = await Promise.all([
      db.collection('cards').where({ openid }).orderBy('updatedAt', 'desc').get(),
      db.collection('bookmarks').where({ openid }).get(),
      db.collection('registrations').where({ openid }).orderBy('registeredAt', 'desc').get(),
      db.collection('sync_pairs').where({ openid, bound: true }).orderBy('boundAt', 'desc').limit(1).get(),
      db.collection('users').where({ openid }).limit(1).get(),
    ]);
    const lastPair = pairs.data && pairs.data[0];
    const user = users.data && users.data[0];

    let organizerApplication = null;
    try {
      const organizer = await db.collection('organizer_applications')
        .where({ openid })
        .orderBy('submittedAt', 'desc')
        .limit(1)
        .get();
      if (organizer.data && organizer.data[0]) {
        organizerApplication = Object.assign({}, organizer.data[0], {
          approvalSource: 'server',
        });
      }
    } catch (e) {
      organizerApplication = null;
    }

    return {
      ok: true,
      cards: cards.data || [],
      bookmarkIds: (bookmarks.data || []).map((b) => b.hackathonId),
      registrations: regs.data || [],
      scan: lastPair ? lastPair.scan : null,
      profile: user ? {
        nickname: user.nickname || '',
        role: user.role || '',
        city: user.city || '',
        bio: user.bio || '',
        github: user.github || '',
        avatarUrl: user.avatarUrl || '',
        skills: Array.isArray(user.skills) ? user.skills : [],
        publicId: user.publicId || '',
        projects: Array.isArray(user.projects) ? user.projects : [],
        experiences: Array.isArray(user.experiences) ? user.experiences : [],
        hackathonHistory: Array.isArray(user.hackathonHistory) ? user.hackathonHistory : [],
        awards: Array.isArray(user.awards) ? user.awards : [],
        teamPreference: user.teamPreference && typeof user.teamPreference === 'object' ? user.teamPreference : {},
      } : null,
      agentConfig: user && user.agentConfig && typeof user.agentConfig === 'object'
        ? user.agentConfig
        : null,
      organizerApplication,
    };
  } catch (e) {
    return { ok: false, message: String(e), cards: [], bookmarkIds: [], registrations: [], scan: null };
  }
};
