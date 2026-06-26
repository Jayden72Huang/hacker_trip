// 云函数：加入报名清单。集合 registrations: { openid, ...item, registeredAt }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

async function getPublishedHackathon(id) {
  const clean = String(id || '').trim();
  if (!clean) return null;
  const col = db.collection('hackathons');
  const byBizId = await col.where({ id: clean, isPublished: _.neq(false) }).limit(1).get();
  if (byBizId.data && byBizId.data[0]) return byBizId.data[0];
  try {
    const byDocId = await col.doc(clean).get();
    return byDocId.data && byDocId.data.isPublished !== false ? byDocId.data : null;
  } catch (e) {
    return null;
  }
}

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
    const published = await getPublishedHackathon(item.id);
    if (!published) return { ok: false, code: 'HACKATHON_NOT_AVAILABLE', message: '赛事不存在或已下线' };
    const exist = await col.where({ openid, id: published.id }).limit(1).get();
    if (!(exist.data && exist.data[0])) {
      await col.add({ data: Object.assign({}, published, { openid, registeredAt: Date.now() }) });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
