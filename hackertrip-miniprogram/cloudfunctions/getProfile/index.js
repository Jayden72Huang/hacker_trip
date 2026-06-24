// 云函数：拉取当前用户的卡片 / 收藏 / 报名清单 / 同步状态
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  try {
    const [cards, bookmarks, regs, pairs] = await Promise.all([
      db.collection('cards').where({ openid }).orderBy('updatedAt', 'desc').get(),
      db.collection('bookmarks').where({ openid }).get(),
      db.collection('registrations').where({ openid }).orderBy('registeredAt', 'desc').get(),
      db.collection('sync_pairs').where({ openid, bound: true }).orderBy('boundAt', 'desc').limit(1).get(),
    ]);
    const lastPair = pairs.data && pairs.data[0];

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
      organizerApplication,
    };
  } catch (e) {
    return { ok: false, message: String(e), cards: [], bookmarkIds: [], registrations: [], scan: null };
  }
};
