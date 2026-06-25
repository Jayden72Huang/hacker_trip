const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function buildProjects(scan) {
  const project = scan && scan.project && typeof scan.project === 'object' ? scan.project : null;
  if (!project || !(project.name || project.summary || project.description)) return [];
  const matches = Array.isArray(scan.matches) ? scan.matches : [];
  const firstMatch = matches.length ? matches[0] : null;
  const tags = Array.isArray(project.techStack) && project.techStack.length
    ? project.techStack.slice(0, 6)
    : (Array.isArray(project.tags) ? project.tags.slice(0, 6) : []);
  return [{
    id: project.id || `sync-${scan.syncedAt || 'project'}`,
    name: project.name || '未命名项目',
    desc: project.summary || project.description || '来自 Skills 同步的项目画像',
    event: firstMatch ? (firstMatch.name || firstMatch.hackathonId || '匹配赛事') : '未关联赛事',
    status: scan.syncedAt ? '已同步' : '待完善',
    tags,
  }];
}

exports.main = async (event) => {
  const uid = String((event && event.uid) || '').trim();
  if (!uid) return { ok: false, message: '缺少用户 id' };

  try {
    const users = await db.collection('users').where({ publicId: uid }).limit(1).get();
    const user = users.data && users.data[0];
    if (!user) return { ok: false, message: '用户不存在' };

    const [pairs, regs] = await Promise.all([
      db.collection('sync_pairs').where({ openid: user.openid, bound: true }).orderBy('boundAt', 'desc').limit(1).get(),
      db.collection('registrations').where({ openid: user.openid }).orderBy('registeredAt', 'desc').get(),
    ]);

    const lastPair = pairs.data && pairs.data[0];
    const projects = buildProjects(lastPair ? lastPair.scan : null);
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
          projects: projects.length,
          skills: skills.length,
        },
      },
      projects,
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
