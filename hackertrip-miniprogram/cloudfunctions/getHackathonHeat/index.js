// 云函数：getHackathonHeat —— 聚合赛事的选手热度（F3 主办方获客）。
// 数据源：registrations(报名, where id) + bookmarks(收藏, where hackathonId)。
// 热度值 = 报名*3 + 收藏*1，给主办方一个直观的「有多少人想来」。
// 支持单个（event.id）和批量（event.ids，上限 50，供列表页一次拉全）。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

async function countSingle(id) {
  const [regs, marks] = await Promise.all([
    db.collection('registrations').where({ id }).count(),
    db.collection('bookmarks').where({ hackathonId: id }).count(),
  ]);
  const registrations = regs.total || 0;
  const bookmarks = marks.total || 0;
  return { ok: true, id, registrations, bookmarks, fans: registrations + bookmarks, heat: registrations * 3 + bookmarks };
}

async function groupCount(collection, field, ids) {
  const res = await db.collection(collection)
    .aggregate()
    .match({ [field]: _.in(ids) })
    .group({ _id: `$${field}`, n: $.sum(1) })
    .end();
  const map = {};
  (res.list || []).forEach((row) => { map[row._id] = row.n || 0; });
  return map;
}

async function countBatch(ids) {
  const [regMap, markMap] = await Promise.all([
    groupCount('registrations', 'id', ids),
    groupCount('bookmarks', 'hackathonId', ids),
  ]);
  const heats = {};
  ids.forEach((id) => {
    const registrations = regMap[id] || 0;
    const bookmarks = markMap[id] || 0;
    heats[id] = { registrations, bookmarks, fans: registrations + bookmarks, heat: registrations * 3 + bookmarks };
  });
  return { ok: true, heats };
}

exports.main = async (event) => {
  const ids = Array.isArray(event && event.ids)
    ? event.ids.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 50)
    : null;

  try {
    if (ids && ids.length) return await countBatch(ids);
    const id = String((event && event.id) || '').trim();
    if (!id) return { ok: false, message: '缺少赛事 id' };
    return await countSingle(id);
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
