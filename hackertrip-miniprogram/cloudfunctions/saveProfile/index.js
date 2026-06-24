const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function makePublicId(openid) {
  const source = `${openid || 'anon'}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }
  return `u_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext() || {};
  const openid = wxContext.OPENID;
  const profile = (event && event.profile) || {};
  if (!openid) return { ok: false, message: '缺少用户身份' };

  const col = db.collection('users');
  const now = Date.now();
  const allowed = {
    nickname: profile.nickname || '',
    role: profile.role || '',
    city: profile.city || '',
    bio: profile.bio || '',
    github: profile.github || '',
    avatarUrl: profile.avatarUrl || '',
    skills: Array.isArray(profile.skills) ? profile.skills.slice(0, 20) : [],
    updatedAt: now,
  };

  try {
    const existed = await col.where({ openid }).limit(1).get();
    if (existed.data && existed.data[0]) {
      const doc = existed.data[0];
      const data = Object.assign({}, allowed);
      if (!doc.publicId) data.publicId = makePublicId(openid);
      await col.doc(doc._id).update({ data });
      return { ok: true, publicId: data.publicId || doc.publicId };
    }

    const publicId = makePublicId(openid);
    await col.add({
      data: Object.assign({}, allowed, {
        openid,
        publicId,
        createdAt: now,
      }),
    });
    return { ok: true, publicId };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
