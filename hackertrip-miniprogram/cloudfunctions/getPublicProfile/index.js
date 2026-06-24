const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const uid = String((event && event.uid) || '').trim();
  if (!uid) return { ok: false, message: '缺少用户 id' };

  try {
    const users = await db.collection('users').where({ publicId: uid }).limit(1).get();
    const user = users.data && users.data[0];
    if (!user) return { ok: false, message: '用户不存在' };

    const [cards, regs] = await Promise.all([
      db.collection('cards').where({ openid: user.openid }).orderBy('updatedAt', 'desc').get(),
      db.collection('registrations').where({ openid: user.openid }).orderBy('registeredAt', 'desc').get(),
    ]);

    const skills = Array.isArray(user.skills) ? user.skills : [];
    return {
      ok: true,
      profile: {
        uid,
        name: user.nickname || 'HackerTrip 用户',
        role: user.role || 'Builder',
        city: user.city || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        github: user.github || '',
        skills,
        stats: {
          hackathons: (regs.data || []).length,
          projects: (cards.data || []).length,
          skills: skills.length,
        },
      },
      projects: (cards.data || []).slice(0, 6).map((card) => ({
        name: card.name || card.role || 'HackerTrip 身份卡',
        desc: Array.isArray(card.techStack) ? card.techStack.slice(0, 4).join(' / ') : '身份卡作品',
      })),
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
