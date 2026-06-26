// 云函数：查询黑客松列表（已发布）
// 集合 hackathons 字段与 miniprogram/data/hackathons.js 一致
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.main = async (event) => {
  const { q, mode, status, sort, limit = 50 } = event || {};
  const col = db.collection('hackathons');
  let query = { isPublished: _.neq(false) };

  if (mode && mode !== 'all') query.mode = mode;
  if (status === 'upcoming') query.isPast = _.neq(true);
  if (status === 'ended') query.isPast = true;

  // 关键词：覆盖赛事文本与标签字段，保证 "AI/硬件/Web3/React" 等自然语言入口可召回
  if (q && q.trim()) {
    const reg = db.RegExp({ regexp: escapeRegExp(q.trim().slice(0, 60)), options: 'i' });
    query = _.and([
      query,
      _.or([
        { name: reg },
        { shortName: reg },
        { city: reg },
        { location: reg },
        { theme: reg },
        { summary: reg },
        { tracks: reg },
        { techStack: reg },
        { tags: reg },
      ]),
    ]);
  }

  try {
    let ref = col.where(query);
    const orderField = sort === 'name' ? 'name' : 'startDate';
    const res = await ref
      .orderBy(orderField, sort === 'name' ? 'asc' : 'desc')
      .limit(Math.min(limit, 100))
      .get();
    return { ok: true, list: res.data || [] };
  } catch (e) {
    return { ok: false, list: [], error: String(e) };
  }
};
