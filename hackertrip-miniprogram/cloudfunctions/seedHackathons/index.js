// 云函数：一次性把内置黑客松数据导入云数据库 hackathons 集合。
// 用法：在开发者工具云函数面板右键「云端测试」运行一次即可。
// 幂等：按业务字段 id 去重，已存在则更新。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const DATA = require('./data.js');

function isAllowed(event) {
  const openid = (cloud.getWXContext() || {}).OPENID;
  const admins = String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const token = process.env.SEED_TOKEN || '';
  if (admins.length && admins.indexOf(openid) !== -1) return true;
  if (token && event && event.seedToken === token) return true;
  return false;
}

exports.main = async (event) => {
  if (!isAllowed(event)) {
    return { ok: false, code: 'FORBIDDEN', message: '无权执行种子数据导入' };
  }

  const col = db.collection('hackathons');
  let inserted = 0;
  let updated = 0;
  for (const item of DATA) {
    try {
      const exist = await col.where({ id: item.id }).limit(1).get();
      if (exist.data && exist.data[0]) {
        await col.doc(exist.data[0]._id).update({ data: Object.assign({}, item, { isPublished: true }) });
        updated++;
      } else {
        await col.add({ data: Object.assign({}, item, { isPublished: true }) });
        inserted++;
      }
    } catch (e) {
      // 集合不存在时首次 add 会自动建集合
      try {
        await col.add({ data: Object.assign({}, item, { isPublished: true }) });
        inserted++;
      } catch (e2) {}
    }
  }
  return { ok: true, inserted, updated, total: DATA.length };
};
