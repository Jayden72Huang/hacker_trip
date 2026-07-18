// 云函数：eventHub —— 黑客松现场身份、签到、可信履历和 AI 破冰 MVP
// actions:
//   checkin             当前用户签到并生成活动身份快照
//   saveEventProfile    保存当前用户在某场活动中的组队/社交状态
//   getEventProfile     读取当前用户活动身份、签到、验证履历
//   listEventMembers    读取同活动开放认识的成员列表
//   createHandshake     生成当前用户和目标用户的破冰/互补报告
//   verifyAchievement   主办方给用户写入已验证赛事履历
//   listAchievements    读取当前用户或公开用户的履历
//   issueCertificates   主办方按名单批量发放电子证书（每人一个验证码）
//   listCertificates    主办方查看自己发出的证书和领取状态
//   claimCertificate    选手凭姓名+验证码领取证书，自动写入官方认证履历
//   addSelfAchievement  选手自录过往履历（未验证，可带产品链接和截图）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

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
  await ensureCollection('achievements');
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
    productUrl: item.productUrl || '',
    imageFileId: item.imageFileId || '',
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
  await ensureCollection('achievements');
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

/* ----------------------------- 内容安全 ----------------------------- */

// 发证名单/自述履历会通过分享页公开展示，入库前必须过检；risky 或检测服务异常都拒绝（与 submitOrganizerApplication 同策略）
async function checkTextSecurity(openid, text, title) {
  const content = cleanText(text, 10000);
  if (!content) return null;
  // msgSecCheck 单次上限 2500 字符，超长分段送检
  for (let i = 0; i < content.length; i += 2500) {
    let security = null;
    try {
      security = await cloud.openapi.security.msgSecCheck({
        openid,
        scene: 1,
        version: 2,
        content: content.slice(i, i + 2500),
        title: cleanText(title, 60),
      });
    } catch (e) {
      return { ok: false, code: 'SECURITY_CHECK_FAILED', message: '内容安全检测失败，请稍后重试' };
    }
    if (security.errcode && security.errcode !== 0) {
      return { ok: false, code: 'SECURITY_CHECK_FAILED', message: security.errmsg || '内容安全检测失败，请稍后重试' };
    }
    if (security.result && security.result.suggest === 'risky') {
      return { ok: false, code: 'CONTENT_RISKY', message: '内容未通过安全检测，请修改后重试' };
    }
  }
  return null;
}

async function checkImageSecurity(fileId) {
  if (!fileId) return null;
  let buffer = null;
  try {
    const res = await cloud.downloadFile({ fileID: fileId });
    buffer = res && res.fileContent;
  } catch (e) {
    return { ok: false, code: 'IMAGE_CHECK_FAILED', message: '图片读取失败，请重新上传' };
  }
  if (!buffer || !buffer.length) {
    return { ok: false, code: 'IMAGE_CHECK_FAILED', message: '图片读取失败，请重新上传' };
  }
  // imgSecCheck 限制单图 <1M（前端已用 compressed，超限提示换图）
  if (buffer.length > 1024 * 1024) {
    return { ok: false, code: 'IMAGE_TOO_LARGE', message: '图片超过 1M，请换一张小一点的图片' };
  }
  const contentType = /\.png($|\?)/i.test(fileId) ? 'image/png' : 'image/jpeg';
  try {
    const security = await cloud.openapi.security.imgSecCheck({ media: { contentType, value: buffer } });
    if (security.errcode && security.errcode !== 0) {
      return { ok: false, code: 'IMAGE_CHECK_FAILED', message: security.errmsg || '图片安全检测失败，请稍后重试' };
    }
  } catch (e) {
    // 87014：图片含违规内容
    if ((e && e.errCode === 87014) || String(e).indexOf('87014') !== -1) {
      return { ok: false, code: 'IMAGE_RISKY', message: '图片未通过安全检测，请更换后重试' };
    }
    return { ok: false, code: 'IMAGE_CHECK_FAILED', message: '图片安全检测失败，请稍后重试' };
  }
  return null;
}

/* ----------------------------- 电子证书 ----------------------------- */

// 验证码字母表：去掉 0/O/1/I/L 等易混字符
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function randomCode(len) {
  let out = '';
  for (let i = 0; i < (len || 6); i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// 批量生成不重复验证码：本地去重后一次 in 查询查库内冲突，避免逐个 findOne 串行拖垮超时
async function generateUniqueCodes(count) {
  const codes = [];
  const seen = {};
  for (let attempt = 0; attempt < 8 && codes.length < count; attempt += 1) {
    const batch = [];
    while (batch.length < count - codes.length) {
      const code = randomCode(attempt < 5 ? 6 : 8);
      if (!seen[code]) {
        seen[code] = true;
        batch.push(code);
      }
    }
    const existed = await db.collection('certificates').where({ code: _.in(batch) }).limit(1000).get();
    const taken = {};
    (existed.data || []).forEach((item) => { taken[item.code] = true; });
    batch.forEach((code) => { if (!taken[code]) codes.push(code); });
  }
  return codes;
}

function publicCertificate(doc) {
  const item = doc || {};
  return {
    id: item._id || '',
    eventId: item.eventId || '',
    eventName: item.eventName || '',
    title: item.title || '',
    level: item.level || 'award',
    recipientName: item.recipientName || '',
    code: item.code || '',
    issuerName: item.issuerName || '',
    imageFileId: item.imageFileId || '',
    status: item.status || 'unclaimed',
    claimedAt: item.claimedAt || 0,
    createdAt: item.createdAt || 0,
  };
}

function isCollectionMissing(e) {
  const msg = String((e && e.errMsg) || (e && e.message) || e || '');
  return (e && e.errCode === -502005) || msg.indexOf('-502005') !== -1 || msg.indexOf('not exist') !== -1;
}

/** 集合不存在时自动创建（新环境首次发奖/领奖免手动建集合）；查询/写入前先过这里 */
const readyCollections = {};
async function ensureCollection(name) {
  if (readyCollections[name]) return;
  try {
    await db.collection(name).where({ code: '__probe__' }).limit(1).get();
  } catch (e) {
    if (!isCollectionMissing(e)) throw e;
    await db.createCollection(name).catch(() => {});
  }
  readyCollections[name] = true;
}

/** 名单解析：支持 [{name,title}] 数组，或每行「名字」/「名字,奖项」的多行文本 */
function parseRecipients(event) {
  const raw = event.recipients;
  let items = [];
  if (Array.isArray(raw)) {
    items = raw.map((item) => {
      if (typeof item === 'string') return { name: item, title: '' };
      return { name: (item && item.name) || '', title: (item && item.title) || '' };
    });
  } else {
    const text = typeof raw === 'string' ? raw : String(event.names || '');
    items = text.split(/\n/).map((line) => {
      const parts = line.split(/[,，|｜]/);
      return { name: parts[0] || '', title: parts.slice(1).join(' ') || '' };
    });
  }
  const cleaned = items
    .map((item) => ({ name: cleanText(item.name, 40), title: cleanText(item.title, 80) }))
    .filter((item) => item.name);
  // 单次上限 100，超出部分返回 total 让前端明确提示，而不是静默丢弃
  return { list: cleaned.slice(0, 100), total: cleaned.length };
}

// 名字比对：去空格 + 忽略大小写，容忍主办方和选手输入的细微差异
function normalizeName(value) {
  return cleanText(value, 40).replace(/\s+/g, '').toLowerCase();
}

async function handleIssueCertificates(openid, event) {
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  const organizer = await getApprovedOrganizer(openid);
  if (!organizer) return { ok: false, code: 'NO_PERMISSION', message: '只有已认证主办方可以发放证书' };
  await ensureCollection('certificates');
  const eventId = cleanText(event.eventId, 120);
  const eventDoc = eventId ? await getHackathon(eventId) : null;
  if (eventId && !canVerifyForEvent(openid, organizer, eventDoc)) {
    return { ok: false, code: 'NO_PERMISSION', message: '只能给自己主办的赛事发放证书' };
  }
  const eventName = cleanText(event.eventName || (eventDoc && eventDoc.name), 120);
  const defaultTitle = cleanText(event.title, 80);
  const level = cleanText(event.level || 'award', 40);
  const imageFileId = cleanText(event.imageFileId, 300);
  const parsed = parseRecipients(event);
  const recipients = parsed.list;
  if (!eventName) return { ok: false, code: 'BAD_REQUEST', message: '请填写赛事名称' };
  if (!recipients.length) return { ok: false, code: 'BAD_REQUEST', message: '请填写选手名单（一行一个名字）' };
  // 每行可用「名字,奖项」单独指定奖项；没写的用默认奖项标题
  if (!defaultTitle && recipients.some((item) => !item.title)) {
    return { ok: false, code: 'BAD_REQUEST', message: '请填写默认奖项标题，或在名单每行用「名字,奖项」指定' };
  }
  // 内容安全：赛事名/奖项/名单会随奖杯公开展示，入库前送检
  const securityText = [eventName, defaultTitle]
    .concat(recipients.map((item) => [item.name, item.title].filter(Boolean).join(' ')))
    .filter(Boolean)
    .join('\n');
  const textRisk = await checkTextSecurity(openid, securityText, eventName);
  if (textRisk) return textRisk;
  const imageRisk = await checkImageSecurity(imageFileId);
  if (imageRisk) return imageRisk;
  const issuerName = organizer.orgName || organizer.role || 'HackerTrip 主办方';
  const now = Date.now();
  // 幂等：同主办方同赛事下，同名同奖项已发过的跳过，超时重试/重复提交不会重复发码
  const existedRes = await db.collection('certificates')
    .where({ issuerOpenid: openid, eventName })
    .limit(1000)
    .get();
  const existedKeys = {};
  (existedRes.data || []).forEach((item) => {
    existedKeys[`${normalizeName(item.recipientName)}|${normalizeName(item.title)}`] = true;
  });
  const skipped = [];
  const fresh = recipients.filter((item) => {
    const key = `${normalizeName(item.name)}|${normalizeName(item.title || defaultTitle)}`;
    if (existedKeys[key]) {
      skipped.push(item.name);
      return false;
    }
    existedKeys[key] = true;
    return true;
  });
  const codes = await generateUniqueCodes(fresh.length);
  if (codes.length < fresh.length) {
    return { ok: false, code: 'CODE_GEN_FAILED', message: '验证码生成失败，请稍后重试' };
  }
  const docs = fresh.map((recipient, i) => ({
    eventId,
    eventName,
    title: recipient.title || defaultTitle,
    level,
    recipientName: recipient.name,
    code: codes[i],
    issuerOpenid: openid,
    issuerName,
    imageFileId,
    status: 'unclaimed',
    claimedBy: '',
    claimedAt: 0,
    createdAt: now,
    updatedAt: now,
  }));
  const certificates = [];
  for (let i = 0; i < docs.length; i += 20) {
    const chunk = docs.slice(i, i + 20);
    const added = await Promise.all(chunk.map((data) => db.collection('certificates').add({ data })));
    added.forEach((res, j) => certificates.push(publicCertificate(Object.assign({ _id: res._id }, chunk[j]))));
  }
  return { ok: true, certificates, skipped, truncated: Math.max(0, parsed.total - recipients.length) };
}

async function handleListCertificates(openid) {
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  await ensureCollection('certificates');
  const res = await db.collection('certificates')
    .where({ issuerOpenid: openid })
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return { ok: true, certificates: (res.data || []).map(publicCertificate) };
}

async function handleClaimCertificate(openid, event) {
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  const name = cleanText(event.name, 40);
  const code = cleanText(event.code, 20).replace(/\s+/g, '').toUpperCase();
  if (!name || !code) return { ok: false, code: 'BAD_REQUEST', message: '请填写姓名和验证码' };
  await ensureCollection('certificates');
  const cert = await findOne('certificates', { code });
  if (!cert) return { ok: false, code: 'NOT_FOUND', message: '验证码不存在，请核对后重试' };
  if (normalizeName(cert.recipientName) !== normalizeName(name)) {
    return { ok: false, code: 'NAME_MISMATCH', message: '姓名与奖状不匹配，请使用主办方登记的名字' };
  }
  // 比赛名称为可选核验项：填了就做宽松比对（去空格忽略大小写，允许包含关系）
  const claimEvent = normalizeName(event.eventName);
  if (claimEvent) {
    const certEvent = normalizeName(cert.eventName);
    if (certEvent && certEvent.indexOf(claimEvent) === -1 && claimEvent.indexOf(certEvent) === -1) {
      return { ok: false, code: 'EVENT_MISMATCH', message: '比赛名称与奖状不匹配，请核对后重试' };
    }
  }
  if (cert.status === 'claimed' && cert.claimedBy && cert.claimedBy !== openid) {
    return { ok: false, code: 'ALREADY_CLAIMED', message: '这张奖状已被其他账号领取' };
  }
  const user = await getCurrentUser(openid);
  const now = Date.now();
  // 原子领取：条件更新（仅未领取或本人已领取时命中），两个账号并发提交同一验证码只有一个成功
  const updated = await db.collection('certificates')
    .where({ _id: cert._id, claimedBy: _.in(['', openid]) })
    .update({
      data: { status: 'claimed', claimedBy: openid, claimedAt: cert.claimedAt || now, updatedAt: now },
    });
  if (!updated || !updated.stats || !updated.stats.updated) {
    return { ok: false, code: 'ALREADY_CLAIMED', message: '这张奖状已被其他账号领取' };
  }
  const payload = {
    eventId: cert.eventId || '',
    eventName: cert.eventName || '',
    publicId: (user && user.publicId) || '',
    title: cert.title || '获奖记录',
    level: cert.level || 'award',
    status: 'verified',
    verified: true,
    verifiedBy: cert.issuerOpenid || '',
    verifiedByName: cert.issuerName || 'HackerTrip 主办方',
    certificateId: cert._id,
    recipientName: cert.recipientName || name,
    imageFileId: cert.imageFileId || '',
    updatedAt: now,
  };
  // 幂等：同一张证书同一用户重复领取只保留一条履历
  await ensureCollection('achievements');
  const saved = await upsert('achievements', { certificateId: cert._id, openid }, Object.assign({}, payload, { createdAt: now }));
  return {
    ok: true,
    achievement: saved,
    certificate: publicCertificate(Object.assign({}, cert, { status: 'claimed', claimedAt: now })),
  };
}

async function handleAddSelfAchievement(openid, event) {
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };
  const eventName = cleanText(event.eventName, 120);
  const title = cleanText(event.title, 80);
  if (!eventName) return { ok: false, code: 'BAD_REQUEST', message: '请填写赛事名称' };
  if (!title) return { ok: false, code: 'BAD_REQUEST', message: '请填写记录标题' };
  const productUrl = cleanText(event.productUrl, 300);
  const imageFileId = cleanText(event.imageFileId, 300);
  // 内容安全：自述履历会在分享页/身份卡公开展示，入库前送检
  const textRisk = await checkTextSecurity(openid, [eventName, title, productUrl].filter(Boolean).join('\n'), title);
  if (textRisk) return textRisk;
  const imageRisk = await checkImageSecurity(imageFileId);
  if (imageRisk) return imageRisk;
  const user = await getCurrentUser(openid);
  const now = Date.now();
  const data = {
    eventId: cleanText(event.eventId, 120),
    eventName,
    openid,
    publicId: (user && user.publicId) || '',
    title,
    level: cleanText(event.level || 'participant', 40),
    status: 'self',
    verified: false,
    verifiedBy: '',
    verifiedByName: '',
    productUrl,
    imageFileId,
    createdAt: now,
    updatedAt: now,
  };
  await ensureCollection('achievements');
  const added = await db.collection('achievements').add({ data });
  return { ok: true, achievement: Object.assign({ id: added._id }, data) };
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  const action = cleanText((event && event.action) || '', 40);
  // 注意：必须 await，否则 handler 内部的 rejection 会绕过 catch 变成云函数执行失败
  try {
    if (action === 'checkin') return await handleCheckin(openid, event || {});
    if (action === 'saveEventProfile') return await handleSaveEventProfile(openid, event || {});
    if (action === 'getEventProfile') return await handleGetEventProfile(openid, event || {});
    if (action === 'listEventMembers') return await handleListMembers(openid, event || {});
    if (action === 'createHandshake') return await handleCreateHandshake(openid, event || {});
    if (action === 'verifyAchievement') return await handleVerifyAchievement(openid, event || {});
    if (action === 'listAchievements') return await handleListAchievements(openid, event || {});
    if (action === 'issueCertificates') return await handleIssueCertificates(openid, event || {});
    if (action === 'listCertificates') return await handleListCertificates(openid);
    if (action === 'claimCertificate') return await handleClaimCertificate(openid, event || {});
    if (action === 'addSelfAchievement') return await handleAddSelfAchievement(openid, event || {});
    return { ok: false, code: 'UNKNOWN_ACTION', message: '未知 action' };
  } catch (e) {
    return { ok: false, code: 'EVENT_HUB_FAILED', message: String(e) };
  }
};
