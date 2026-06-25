// 云函数：加入报名清单。集合 registrations: { openid, ...item, registeredAt }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { item, action, id } = event || {};
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };
  const col = db.collection('registrations');
  try {
    if (action === 'remove') {
      if (!id) return { ok: false, message: '缺少赛事 ID' };
      await col.where({ openid, id }).remove();
      return { ok: true };
    }

    if (!item || !item.id) return { ok: false, message: '缺少赛事信息' };
    const exist = await col.where({ openid, id: item.id }).limit(1).get();
    if (!(exist.data && exist.data[0])) {
      await col.add({ data: Object.assign({}, item, { openid, registeredAt: Date.now() }) });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
