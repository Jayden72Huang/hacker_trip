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

function normalizeProfile(profile) {
  const p = profile || {};
  return {
    nickname: p.nickname || '',
    role: p.role || '',
    city: p.city || '',
    bio: p.bio || '',
    github: p.github || '',
    avatarUrl: p.avatarUrl || '',
    skills: Array.isArray(p.skills) ? p.skills.slice(0, 20) : [],
    updatedAt: Date.now(),
  };
}

async function ensurePublicId(openid, profile) {
  const col = db.collection('users');
  const existed = await col.where({ openid }).limit(1).get();
  const profilePatch = normalizeProfile(profile);
  if (existed.data && existed.data[0]) {
    const doc = existed.data[0];
    const publicId = doc.publicId || makePublicId(openid);
    await col.doc(doc._id).update({
      data: Object.assign({}, profilePatch, { publicId }),
    });
    return publicId;
  }

  const publicId = makePublicId(openid);
  await col.add({
    data: Object.assign({}, profilePatch, {
      openid,
      publicId,
      createdAt: Date.now(),
    }),
  });
  return publicId;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext() || {};
  const openid = wxContext.OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };

  try {
    const publicId = await ensurePublicId(openid, event && event.profile);
    const code = await cloud.openapi.wxacode.getUnlimited({
      scene: `uid=${publicId}`,
      page: 'pages/public-site/public-site',
      checkPath: false,
      width: 280,
    });

    if (!code || !code.buffer) return { ok: false, message: '小程序码生成失败' };
    return {
      ok: true,
      uid: publicId,
      mimeType: 'image/png',
      base64: code.buffer.toString('base64'),
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
