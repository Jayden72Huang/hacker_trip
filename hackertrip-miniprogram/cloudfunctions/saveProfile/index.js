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

function buildSecurityText(profile) {
  const skills = Array.isArray(profile.skills) ? profile.skills.join(' ') : '';
  return [
    profile.nickname,
    profile.role,
    profile.city,
    profile.bio,
    profile.github,
    skills,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2000);
}

async function checkProfileContent(openid, profile) {
  const content = buildSecurityText(profile);
  if (!content) return null;

  const security = await cloud.openapi.security.msgSecCheck({
    openid,
    scene: 1,
    version: 2,
    content,
    title: profile.nickname || 'HackerTrip profile',
  });
  const suggest = security && security.result && security.result.suggest;
  const label = security && security.result && security.result.label;

  if (security.errcode && security.errcode !== 0) {
    return {
      ok: false,
      code: 'SECURITY_CHECK_FAILED',
      message: security.errmsg || '内容安全检测失败',
      security: { errcode: security.errcode, errmsg: security.errmsg },
    };
  }
  if (suggest === 'risky') {
    return {
      ok: false,
      code: 'CONTENT_RISKY',
      message: '身份资料包含不适合公开展示的内容',
      security: { suggest, label },
    };
  }
  return null;
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
    const securityError = await checkProfileContent(openid, allowed);
    if (securityError) return securityError;

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
