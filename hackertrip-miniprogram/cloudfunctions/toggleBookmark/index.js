// 云函数：收藏/取消收藏。集合 bookmarks: { openid, hackathonId, createdAt }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { id, active } = event || {};
  if (!id) return { ok: false };
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };
  const col = db.collection('bookmarks');
  try {
    const exist = await col.where({ openid, hackathonId: id }).limit(1).get();
    if (active) {
      if (!(exist.data && exist.data[0])) {
        await col.add({ data: { openid, hackathonId: id, createdAt: Date.now() } });
      }
    } else if (exist.data && exist.data[0]) {
      await col.doc(exist.data[0]._id).remove();
    }
    return { ok: true, active: !!active };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
