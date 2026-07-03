// 云函数：eventHub —— 黑客松现场身份、签到、可信履历和 AI 破冰 MVP
// actions:
//   checkin             当前用户签到并生成活动身份快照
//   saveEventProfile    保存当前用户在某场活动中的组队/社交状态
//   getEventProfile     读取当前用户活动身份、签到、验证履历
//   listEventMembers    读取同活动开放认识的成员列表
//   createHandshake     生成当前用户和目标用户的破冰/互补报告
//   verifyAchievement   主办方给用户写入已验证赛事履历
//   listAchievements    读取当前用户或公开用户的履历
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanText(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 500);
}

function cleanList(value, maxItems, maxLength) {
  let list = [];
  if (Array.isArray(value)) {
    list = value;
  } else if (typeof value === 'string') {
    list = value.split(/[,\n，、\/]/);
  }
  return list
    .map((item) => cleanText(item, maxLength || 40))
    .filter(Boolean)
    .slice(0, maxItems || 12);
}

function normalizeBoolean(value, fallback) {
  if (value === true || value === false) return value;
  return !!fallback;
}

function normalizeRole(value) {
  const role = cleanText(value, 40);
  return role || '参赛者';
}

function normalizeEventProfile(form, user) {
  const src = form && typeof form === 'object' ? form : {};
  return {
    displayName: cleanText(src.displayName || user.nickname, 40),
    role: normalizeRole(src.role || user.role),
    city: cleanText(src.city || user.city, 40),
    skills: cleanList(src.skills && src.skills.length ? src.skills : user.skills, 16, 40),
    projectIdea: cleanText(src.projectIdea, 240),
    lookingFor: cleanList(src.lookingFor, 8, 40),
    availability: cleanText(src.availability, 80),
    openToMeet: normalizeBoolean(src.openToMeet, true),
    contactHint: cleanText(src.contactHint, 80),
  };
}

function publicUser(user) {
  const item = user || {};
  return {
    uid: item.publicId || '',
    name: item.nickname || item.name || '',
    role: item.role || '',
    city: item.city || '',
    avatarUrl: item.avatarUrl || '',
    skills: Array.isArray(item.skills) ? item.skills.slice(0, 16) : [],
  };
}

function publicMember(doc) {
  const item = doc || {};
  return {
    uid: item.publicId || '',
    eventId: item.eventId || '',
    displayName: item.displayName || '',
    role: item.role || '',
    city: item.city || '',
    avatarUrl: item.avatarUrl || '',
    skills: Array.isArray(item.skills) ? item.skills.slice(0, 12) : [],
    projectIdea: item.projectIdea || '',
    lookingFor: Array.isArray(item.lookingFor) ? item.lookingFor.slice(0, 8) : [],
    availability: item.availability || '',
    openToMeet: item.openToMeet !== false,
    checkedInAt: item.checkedInAt || 0,
    updatedAt: item.updatedAt || 0,
  };
}

async function getCurrentUser(openid) {
  if (!openid) return null;
  const res = await db.collection('users').where({ openid }).limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function getUserByUid(uid) {
  const id = cleanText(uid, 80);
  if (!id) return null;
  const res = await db.collection('users').where({ publicId: id }).limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function getHackathon(eventId) {
  const id = cleanText(eventId, 120);
  if (!id) return null;
  const direct = await db.collection('hackathons').where({ id }).limit(1).get();
  if (direct.data && direct.data[0]) return direct.data[0];
  try {
    const byDoc = await db.collection('hackathons').doc(id).get();
    return byDoc && byDoc.data ? byDoc.data : null;
  } catch (e) {
    return null;
  }
}

async function getApprovedOrganizer(openid) {
  if (!openid) return null;
  const res = await db.collection('organizer_applications')
    .where({ openid, status: 'approved' })
    .limit(1)
    .get();
  return res.data && res.data[0] ? res.data[0] : null;
}

function canVerifyForEvent(openid, organizer, eventDoc) {
  if (!openid || !organizer) return false;
  const eventOwner = eventDoc && (eventDoc.organizerOpenid || eventDoc.openid);
  if (!eventOwner) return true;
  return eventOwner === openid;
}

async function findOne(collection, query) {
  const res = await db.collection(collection).where(query).limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function upsert(collection, query, data) {
  const existed = await findOne(collection, query);
  if (existed) {
    await db.collection(collection).doc(existed._id).update({ data });
    return Object.assign({}, existed, data, { _id: existed._id });
  }
  const added = await db.collection(collection).add({ data: Object.assign({}, query, data) });
  return Object.assign({}, query, data, { _id: added._id });
}

function eventSummary(eventDoc, eventId) {
  const event = eventDoc || {};
  return {
    id: event.id || eventId || '',
    name: event.name || event.shortName || '未命名黑客松',
    city: event.city || event.location || '',
    startDate: event.startDate || '',
    endDate: event.endDate || '',
    modeText: event.modeText || event.mode || '',
  };
}

async function handleCheckin(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const user = await getCurrentUser(openid);
  if (!user) return { ok: false, code: 'NO_PROFILE', message: '请先完善身份资料' };

  const now = Date.now();
  const eventDoc = await getHackathon(eventId);
  const profile = normalizeEventProfile(event.profile, user);
  await upsert('event_checkins', { eventId, openid }, {
    publicId: user.publicId || '',
    checkedInAt: now,
    updatedAt: now,
    source: cleanText(event.source || 'miniapp', 40),
  });
  const savedProfile = await upsert('event_profiles', { eventId, openid }, Object.assign({}, profile, {
    publicId: user.publicId || '',
    avatarUrl: user.avatarUrl || '',
    checkedInAt: now,
    updatedAt: now,
  }));

  return {
    ok: true,
    event: eventSummary(eventDoc, eventId),
    checkin: { eventId, checkedInAt: now },
    eventProfile: publicMember(savedProfile),
  };
}

async function handleSaveEventProfile(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const user = await getCurrentUser(openid);
  if (!user) return { ok: false, code: 'NO_PROFILE', message: '请先完善身份资料' };
  const now = Date.now();
  const checked = await findOne('event_checkins', { eventId, openid });
  const profile = normalizeEventProfile(event.profile, user);
  const saved = await upsert('event_profiles', { eventId, openid }, Object.assign({}, profile, {
    publicId: user.publicId || '',
    avatarUrl: user.avatarUrl || '',
    checkedInAt: checked ? checked.checkedInAt || 0 : 0,
    updatedAt: now,
  }));
  return { ok: true, eventProfile: publicMember(saved) };
}

async function loadAchievementsFor(openid, uid) {
  let query = {};
  if (openid) query.openid = openid;
  else if (uid) query.publicId = uid;
  else return [];
  const res = await db.collection('achievements')
    .where(query)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return (res.data || []).map((item) => ({
    id: item._id || '',
    eventId: item.eventId || '',
    eventName: item.eventName || '',
    title: item.title || '',
    level: item.level || '',
    status: item.status || 'verified',
    verified: item.verified === true,
    verifiedByName: item.verifiedByName || '',
    createdAt: item.createdAt || 0,
  }));
}

async function handleGetEventProfile(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const eventDoc = await getHackathon(eventId);
  const user = await getCurrentUser(openid);
  const checkin = await findOne('event_checkins', { eventId, openid });
  const profile = await findOne('event_profiles', { eventId, openid });
  const achievements = await loadAchievementsFor(openid);
  return {
    ok: true,
    event: eventSummary(eventDoc, eventId),
    user: publicUser(user),
    checkedIn: !!checkin,
    checkin: checkin ? { eventId, checkedInAt: checkin.checkedInAt || 0 } : null,
    eventProfile: profile ? publicMember(profile) : null,
    achievements,
  };
}

async function handleListMembers(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId) return { ok: false, code: 'NO_EVENT', message: '缺少活动 ID' };
  const eventDoc = await getHackathon(eventId);
  const res = await db.collection('event_profiles')
    .where({ eventId, openToMeet: true })
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get();
  const members = (res.data || [])
    .filter((item) => item.openid !== openid)
    .map(publicMember);
  return { ok: true, event: eventSummary(eventDoc, eventId), members };
}

function intersect(a, b) {
  const left = cleanList(a, 40, 40).map((item) => item.toLowerCase());
  const original = cleanList(a, 40, 40);
  const right = cleanList(b, 40, 40).map((item) => item.toLowerCase());
  return original.filter((item, index) => right.indexOf(left[index]) !== -1);
}

function difference(a, b) {
  const right = cleanList(b, 40, 40).map((item) => item.toLowerCase());
  return cleanList(a, 40, 40).filter((item) => right.indexOf(item.toLowerCase()) === -1);
}

function buildHandshake(me, target) {
  const sameSkills = intersect(me.skills, target.skills).slice(0, 5);
  const targetUnique = difference(target.skills, me.skills).slice(0, 5);
  const myUnique = difference(me.skills, target.skills).slice(0, 5);
  const sameCity = me.city && target.city && me.city === target.city;
  const sameRole = me.role && target.role && me.role === target.role;
  const score = Math.min(96, 52 + sameSkills.length * 8 + targetUnique.length * 5 + (sameCity ? 6 : 0) + (!sameRole ? 6 : 0));
  const common = [];
  const complement = [];
  const topics = [];

  if (sameSkills.length) {
    common.push(`你们都提到了 ${sameSkills.join('、')}，适合从技术选择或项目经验聊起。`);
    topics.push(`你最近一次用 ${sameSkills[0]} 解决了什么问题？`);
  }
  if (sameCity) common.push(`你们都在 ${me.city}，线下交流和赛后继续合作成本更低。`);
  if (!common.length) common.push('你们目前公开资料重叠不多，适合用项目想法和参赛目标快速破冰。');

  if (targetUnique.length) complement.push(`${target.displayName || '对方'}有 ${targetUnique.join('、')}，可以补齐你的能力半径。`);
  if (myUnique.length) complement.push(`你有 ${myUnique.join('、')}，也能给对方提供不同视角。`);
  if (me.role && target.role && !sameRole) complement.push(`你们角色分别偏「${me.role}」和「${target.role}」，更适合组成跨职能小队。`);
  if (!complement.length) complement.push('你们能力结构接近，适合一起做高强度原型推进或互相 review。');

  if (target.projectIdea) topics.push(`我看到你想做「${target.projectIdea}」，现在最缺哪块？`);
  if (target.lookingFor && target.lookingFor.length) topics.push(`你现在在找 ${target.lookingFor.join('、')}，我可以帮上哪一块？`);
  if (!topics.length) topics.push('这场比赛你最想验证哪个想法？');

  return {
    score,
    summary: `${score}% 适合认识。先聊共同技术，再看项目目标和角色互补。`,
    common,
    complement,
    topics: topics.slice(0, 4),
    opener: `嗨，我是 ${me.displayName || 'HackerTrip 用户'}。HackerTrip 说我们有 ${score}% 的合作契合度，想听听你这次最想做的方向。`,
  };
}

async function handleCreateHandshake(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  const targetUid = cleanText(event.targetUid || event.uid, 80);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId || !targetUid) return { ok: false, code: 'BAD_REQUEST', message: '缺少活动或目标用户' };
  const me = await findOne('event_profiles', { eventId, openid });
  if (!me) return { ok: false, code: 'NO_EVENT_PROFILE', message: '请先完成本场活动签到和身份设置' };
  const targetUser = await getUserByUid(targetUid);
  if (!targetUser) return { ok: false, code: 'NO_TARGET', message: '目标用户不存在' };
  const target = await findOne('event_profiles', { eventId, openid: targetUser.openid });
  if (!target || target.openToMeet === false) return { ok: false, code: 'TARGET_PRIVATE', message: '对方暂未开放活动匹配' };
  const report = buildHandshake(publicMember(me), publicMember(target));
  const now = Date.now();
  await db.collection('handshakes').add({
    data: {
      eventId,
      fromOpenid: openid,
      toOpenid: targetUser.openid,
      targetUid,
      report,
      createdAt: now,
    },
  });
  return { ok: true, me: publicMember(me), target: publicMember(target), report };
}

async function handleVerifyAchievement(openid, event) {
  const eventId = cleanText(event.eventId || event.id, 120);
  const targetUid = cleanText(event.targetUid || event.uid, 80);
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  if (!eventId || !targetUid) return { ok: false, code: 'BAD_REQUEST', message: '缺少活动或目标用户' };
  const organizer = await getApprovedOrganizer(openid);
  const eventDoc = await getHackathon(eventId);
  if (!canVerifyForEvent(openid, organizer, eventDoc)) {
    return { ok: false, code: 'NO_PERMISSION', message: '只有已认证主办方可以验证该赛事履历' };
  }
  const target = await getUserByUid(targetUid);
  if (!target) return { ok: false, code: 'NO_TARGET', message: '目标用户不存在' };
  const now = Date.now();
  const eventName = cleanText(event.eventName || (eventDoc && eventDoc.name), 120);
  const payload = {
    eventName,
    publicId: target.publicId || targetUid,
    title: cleanText(event.title || '参赛记录', 80),
    level: cleanText(event.level || 'participant', 40),
    status: 'verified',
    verified: true,
    verifiedBy: openid,
    verifiedByName: organizer.orgName || organizer.role || 'HackerTrip 主办方',
    updatedAt: now,
  };
  const saved = await upsert('achievements', { eventId, openid: target.openid, title: payload.title }, Object.assign({}, payload, {
    createdAt: now,
  }));
  return { ok: true, achievement: saved };
}

async function handleListAchievements(openid, event) {
  const uid = cleanText(event.uid, 80);
  if (!openid && !uid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  const list = await loadAchievementsFor(uid ? '' : openid, uid);
  return { ok: true, achievements: list };
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  const action = cleanText((event && event.action) || '', 40);
  try {
    if (action === 'checkin') return handleCheckin(openid, event || {});
    if (action === 'saveEventProfile') return handleSaveEventProfile(openid, event || {});
    if (action === 'getEventProfile') return handleGetEventProfile(openid, event || {});
    if (action === 'listEventMembers') return handleListMembers(openid, event || {});
    if (action === 'createHandshake') return handleCreateHandshake(openid, event || {});
    if (action === 'verifyAchievement') return handleVerifyAchievement(openid, event || {});
    if (action === 'listAchievements') return handleListAchievements(openid, event || {});
    return { ok: false, code: 'UNKNOWN_ACTION', message: '未知 action' };
  } catch (e) {
    return { ok: false, code: 'EVENT_HUB_FAILED', message: String(e) };
  }
};
