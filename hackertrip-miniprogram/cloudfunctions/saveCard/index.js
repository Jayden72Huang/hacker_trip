// 云函数：保存/更新用户身份卡。集合 cards: { openid, id, ...card }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { card } = event || {};
  if (!card || !card.id) return { ok: false, message: '缺少卡片数据' };
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };
  const col = db.collection('cards');
  const now = Date.now();
  try {
    const exist = await col.where({ openid, id: card.id }).limit(1).get();
    const data = Object.assign({}, card, { openid, updatedAt: now });
    if (exist.data && exist.data[0]) {
      await col.doc(exist.data[0]._id).update({ data });
    } else {
      await col.add({ data });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
