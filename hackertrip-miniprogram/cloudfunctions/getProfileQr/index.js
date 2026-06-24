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
    const profile = normalizeProfile(event && event.profile);
    const securityError = await checkProfileContent(openid, profile);
    if (securityError) return securityError;

    const publicId = await ensurePublicId(openid, profile);
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
