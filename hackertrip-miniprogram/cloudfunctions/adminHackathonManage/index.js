// 云函数：管理员审核工作台。
// 安全边界：管理员身份只在服务端用 OPENID 校验，前端不能绕过权限直接发布赛事。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength || 500);
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((x) => cleanText(x, 60)).filter(Boolean);
  return String(value || '')
    .split(/[,\n，、]/)
    .map((x) => cleanText(x, 60))
    .filter(Boolean);
}

function normalizeMode(value) {
  return ['offline', 'online', 'hybrid'].indexOf(value) !== -1 ? value : 'offline';
}

function modeText(mode) {
  const map = { offline: '线下', online: '线上', hybrid: '混合' };
  return map[mode] || '线下';
}

function buildHackathonId(name, draftId) {
  const seed = cleanText(name, 40).toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const suffix = cleanText(draftId, 80).slice(-8) || String(Date.now()).slice(-8);
  return `ht-${seed || 'event'}-${suffix}`;
}

async function isAdmin(openid) {
  if (!openid) return false;
  const envAdmins = String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (envAdmins.indexOf(openid) !== -1) return true;

  try {
    const admins = await db.collection('admin_users')
      .where({ openid, active: _.neq(false) })
      .limit(1)
      .get();
    if (admins.data && admins.data[0]) return true;
  } catch (e) {}

  return false;
}

function publicDraftFields(draft, draftId) {
  const mode = normalizeMode(draft.mode);
  return {
    id: draft.hackathonId || buildHackathonId(draft.name, draftId),
    name: cleanText(draft.name, 100),
    shortName: cleanText(draft.shortName || draft.name, 40),
    city: cleanText(draft.city, 60),
    country: cleanText(draft.country || '中国', 40),
    location: cleanText(draft.location || `${draft.city || ''}${draft.city ? '，' : ''}${draft.country || '中国'}`, 120),
    mode,
    modeText: modeText(mode),
    startDate: cleanText(draft.startDate, 20),
    endDate: cleanText(draft.endDate, 20),
    registrationDeadline: cleanText(draft.registrationDeadline || draft.startDate, 20),
    prizePool: cleanText(draft.prizePool, 120),
    tracks: splitList(draft.tracks),
    techStack: splitList(draft.techStack || draft.tracks),
    tags: splitList(draft.tags || draft.tracks),
    website: cleanText(draft.website, 300),
    summary: cleanText(draft.summary, 1000),
    theme: cleanText(draft.theme || draft.summary || draft.name, 160),
    cover: cleanText(draft.cover, 300),
    isPast: draft.isPast === true,
    isPublished: true,
  };
}

async function listData() {
  const [drafts, claims, organizers, hackathons] = await Promise.all([
    db.collection('hackathon_drafts')
      .where({ status: _.in(['pending_review', 'pending_manual_review', 'security_review']) })
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] })),
    db.collection('hackathon_claims')
      .where({ status: _.in(['pending', 'security_review']) })
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] })),
    db.collection('organizer_applications')
      .where({ status: _.in(['pending', 'security_review']) })
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] })),
    db.collection('hackathons')
      .orderBy('startDate', 'desc')
      .limit(80)
      .get()
      .catch(() => ({ data: [] })),
  ]);
  return {
    drafts: drafts.data || [],
    claims: claims.data || [],
    organizers: organizers.data || [],
    hackathons: hackathons.data || [],
  };
}

async function approveDraft(event, openid) {
  const draftId = cleanText(event.draftId, 80);
  if (!draftId) return { ok: false, code: 'INVALID_DRAFT', message: '缺少草稿 id' };

  const draftRes = await db.collection('hackathon_drafts').doc(draftId).get();
  const draft = draftRes.data;
  if (!draft) return { ok: false, code: 'DRAFT_NOT_FOUND', message: '草稿不存在' };

  const now = Date.now();
  const item = Object.assign(publicDraftFields(draft, draftId), {
    sourceDraftId: draftId,
    organizerId: draft.organizerId || '',
    organizerName: draft.organizerName || '',
    organizerOpenid: draft.organizerOpenid || draft.openid || '',
    approvedBy: openid,
    approvedAt: now,
    updatedAt: now,
  });

  const col = db.collection('hackathons');
  const exists = await col.where({ id: item.id }).limit(1).get();
  if (exists.data && exists.data[0]) {
    await col.doc(exists.data[0]._id).update({ data: item });
  } else {
    await col.add({ data: Object.assign({ createdAt: now }, item) });
  }

  await db.collection('hackathon_drafts').doc(draftId).update({
    data: {
      status: 'approved',
      publishedHackathonId: item.id,
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
    },
  });

  return { ok: true, action: 'approveDraft', id: item.id };
}

async function rejectDraft(event, openid) {
  const draftId = cleanText(event.draftId, 80);
  if (!draftId) return { ok: false, code: 'INVALID_DRAFT', message: '缺少草稿 id' };
  const now = Date.now();
  await db.collection('hackathon_drafts').doc(draftId).update({
    data: {
      status: 'rejected',
      rejectReason: cleanText(event.reason || '信息需要补充或未通过人工审核', 300),
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
    },
  });
  return { ok: true, action: 'rejectDraft', id: draftId };
}

async function approveOrganizer(event, openid) {
  const applicationId = cleanText(event.applicationId, 80);
  if (!applicationId) return { ok: false, code: 'INVALID_APPLICATION', message: '缺少组织者申请 id' };
  const now = Date.now();
  await db.collection('organizer_applications').doc(applicationId).update({
    data: {
      status: 'approved',
      approvalSource: 'server',
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
    },
  });
  return { ok: true, action: 'approveOrganizer', id: applicationId };
}

async function getHackathonTarget(eventId, docId) {
  const id = cleanText(eventId, 120);
  const directDocId = cleanText(docId, 80);
  if (directDocId) {
    const byDoc = await db.collection('hackathons').doc(directDocId).get().catch(() => null);
    if (byDoc && byDoc.data) return byDoc.data;
  }
  if (id) {
    const byId = await db.collection('hackathons').where({ id }).limit(1).get();
    if (byId.data && byId.data[0]) return byId.data[0];
    const byDoc = await db.collection('hackathons').doc(id).get().catch(() => null);
    if (byDoc && byDoc.data) return byDoc.data;
  }
  return null;
}

async function getOrganizerForOpenid(ownerOpenid) {
  const owner = cleanText(ownerOpenid, 120);
  if (!owner) return null;
  const res = await db.collection('organizer_applications')
    .where({ openid: owner, status: 'approved' })
    .limit(1)
    .get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function approveClaim(event, openid) {
  const claimId = cleanText(event.claimId, 80);
  if (!claimId) return { ok: false, code: 'INVALID_CLAIM', message: '缺少认领申请 id' };

  const claimRes = await db.collection('hackathon_claims').doc(claimId).get();
  const claim = claimRes.data;
  if (!claim) return { ok: false, code: 'CLAIM_NOT_FOUND', message: '认领申请不存在' };

  const target = await getHackathonTarget(claim.eventId, claim.eventDocId);
  if (!target || !target._id) return { ok: false, code: 'HACKATHON_NOT_FOUND', message: '赛事不存在' };

  const organizer = await getOrganizerForOpenid(claim.openid);
  if (!organizer) return { ok: false, code: 'ORGANIZER_NOT_APPROVED', message: '申请方还没有通过组织者认证' };

  if (target.organizerOpenid && target.organizerOpenid !== claim.openid) {
    return { ok: false, code: 'HACKATHON_ALREADY_CLAIMED', message: '该赛事已绑定其他组织者' };
  }

  const now = Date.now();
  const organizerName = claim.organizerName || organizer.orgName || '';
  await db.collection('hackathons').doc(target._id).update({
    data: {
      organizerOpenid: claim.openid,
      organizerId: organizer._id || claim.organizerId || '',
      organizerName,
      claimId,
      claimStatus: 'approved',
      claimedBy: openid,
      claimedAt: now,
      updatedAt: now,
    },
  });

  await db.collection('hackathon_claims').doc(claimId).update({
    data: {
      status: 'approved',
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
      rejectReason: '',
      boundHackathonId: target.id || claim.eventId || '',
      boundHackathonDocId: target._id || '',
    },
  });

  return { ok: true, action: 'approveClaim', id: claimId, hackathonId: target.id || claim.eventId || '' };
}

async function rejectClaim(event, openid) {
  const claimId = cleanText(event.claimId, 80);
  if (!claimId) return { ok: false, code: 'INVALID_CLAIM', message: '缺少认领申请 id' };
  const now = Date.now();
  await db.collection('hackathon_claims').doc(claimId).update({
    data: {
      status: 'rejected',
      rejectReason: cleanText(event.reason || '主办方证明不足或未通过人工审核', 300),
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
    },
  });
  return { ok: true, action: 'rejectClaim', id: claimId };
}

async function rejectOrganizer(event, openid) {
  const applicationId = cleanText(event.applicationId, 80);
  if (!applicationId) return { ok: false, code: 'INVALID_APPLICATION', message: '缺少组织者申请 id' };
  const now = Date.now();
  await db.collection('organizer_applications').doc(applicationId).update({
    data: {
      status: 'rejected',
      rejectReason: cleanText(event.reason || '组织者信息需要补充或未通过人工审核', 300),
      reviewedBy: openid,
      reviewedAt: now,
      updatedAt: now,
    },
  });
  return { ok: true, action: 'rejectOrganizer', id: applicationId };
}

async function setPublished(event, openid) {
  const docId = cleanText(event.docId, 80);
  const id = cleanText(event.id, 80);
  const published = event.isPublished !== false;
  const now = Date.now();

  let target = null;
  if (docId) {
    const byDoc = await db.collection('hackathons').doc(docId).get().catch(() => null);
    target = byDoc && byDoc.data ? byDoc.data : null;
  }
  if (!target && id) {
    const byId = await db.collection('hackathons').where({ id }).limit(1).get();
    target = byId.data && byId.data[0] ? byId.data[0] : null;
  }
  if (!target || !target._id) return { ok: false, code: 'HACKATHON_NOT_FOUND', message: '赛事不存在' };

  await db.collection('hackathons').doc(target._id).update({
    data: {
      isPublished: published,
      publishStatusUpdatedBy: openid,
      publishStatusUpdatedAt: now,
      updatedAt: now,
    },
  });
  return { ok: true, action: 'setPublished', id: target.id || target._id, isPublished: published };
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  const allowed = await isAdmin(openid);
  if (!allowed) return { ok: false, code: 'FORBIDDEN', isAdmin: false, message: '仅管理员可管理赛事' };

  const action = cleanText((event || {}).action || 'list', 40);
  try {
    if (action === 'check') return { ok: true, isAdmin: true };
    if (action === 'list') return Object.assign({ ok: true, isAdmin: true }, await listData());
    if (action === 'approveDraft') return await approveDraft(event || {}, openid);
    if (action === 'rejectDraft') return await rejectDraft(event || {}, openid);
    if (action === 'approveClaim') return await approveClaim(event || {}, openid);
    if (action === 'rejectClaim') return await rejectClaim(event || {}, openid);
    if (action === 'approveOrganizer') return await approveOrganizer(event || {}, openid);
    if (action === 'rejectOrganizer') return await rejectOrganizer(event || {}, openid);
    if (action === 'setPublished') return await setPublished(event || {}, openid);
    return { ok: false, code: 'UNKNOWN_ACTION', message: '未知管理动作' };
  } catch (e) {
    return { ok: false, code: 'ADMIN_ACTION_FAILED', isAdmin: true, message: String(e) };
  }
};
