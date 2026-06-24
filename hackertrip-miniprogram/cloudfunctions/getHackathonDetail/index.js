// 云函数：查询单个黑客松详情
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { id } = event || {};
  if (!id) return { ok: false, hackathon: null };
  try {
    // 优先按业务字段 id 查；兼容用 _id
    const res = await db.collection('hackathons').where({ id, isPublished: _.neq(false) }).limit(1).get();
    let item = (res.data && res.data[0]) || null;
    if (!item) {
      try {
        const byId = await db.collection('hackathons').doc(id).get();
        item = byId.data && byId.data.isPublished !== false ? byId.data : null;
      } catch (e) {}
    }
    return { ok: true, hackathon: item };
  } catch (e) {
    return { ok: false, hackathon: null, error: String(e) };
  }
};
