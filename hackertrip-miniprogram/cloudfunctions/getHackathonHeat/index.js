// 云函数：getHackathonHeat —— 聚合某场赛事的选手热度（F3 主办方获客）。
// 数据源：registrations(报名, where id) + bookmarks(收藏, where hackathonId)。
// 热度值 = 报名*3 + 收藏*1，给主办方一个直观的「有多少人想来」。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const id = String((event && event.id) || '').trim();
  if (!id) return { ok: false, message: '缺少赛事 id' };

  try {
    const [regs, marks] = await Promise.all([
      db.collection('registrations').where({ id }).count(),
      db.collection('bookmarks').where({ hackathonId: id }).count(),
    ]);
    const registrations = regs.total || 0;
    const bookmarks = marks.total || 0;
    const heat = registrations * 3 + bookmarks;
    return { ok: true, id, registrations, bookmarks, fans: registrations + bookmarks, heat };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
