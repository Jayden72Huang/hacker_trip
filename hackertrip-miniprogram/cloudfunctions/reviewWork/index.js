// 云函数：用户自审作品（个人主页作品发布控制）。
// 需 openid。用户只能操作自己名下的 works，不能碰别人的。
//   action='list'    —— 列出当前用户所有作品（含 status: pending|published|rejected）
//   action='approve' —— 发布作品（status -> published），才会出现在公开个人主页
//   action='reject'  —— 下架作品（status -> rejected）
//   action='delete'  —— 删除作品
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanId(v) {
  return String(v == null ? '' : v).trim().slice(0, 80);
}

function isCollectionNotFound(error) {
  const message = String((error && (error.errMsg || error.message)) || error || '');
  return /COLLECTION_NOT_EXIST|collection not exists|Db or Table not exist|Table not exist/i.test(message);
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID || '';
  if (!openid) return { ok: false, code: 'NO_OPENID', message: '缺少用户身份' };

  const action = String((event && event.action) || 'list').trim();
  const col = db.collection('works');
  const now = Date.now();

  // 列出自己的全部作品（供「我的→作品」审核页展示）
  if (action === 'list') {
    try {
      const res = await col.where({ openid }).orderBy('createdAt', 'desc').limit(100).get();
      return { ok: true, works: res.data || [] };
    } catch (e) {
      if (isCollectionNotFound(e)) return { ok: true, works: [] };
      return { ok: false, code: 'LIST_FAILED', message: String(e) };
    }
  }

  const workId = cleanId(event && event.workId);
  if (!workId) return { ok: false, code: 'INVALID_WORK', message: '缺少作品 id' };

  // 取作品并校验归属：只能管理自己的作品
  let work = null;
  try {
    const res = await col.doc(workId).get();
    work = res.data;
  } catch (e) {
    if (isCollectionNotFound(e)) {
      return { ok: false, code: 'WORK_NOT_FOUND', message: '作品不存在' };
    }
    return { ok: false, code: 'WORK_NOT_FOUND', message: '作品不存在' };
  }
  if (!work) return { ok: false, code: 'WORK_NOT_FOUND', message: '作品不存在' };
  if (work.openid !== openid) return { ok: false, code: 'FORBIDDEN', message: '只能管理自己的作品' };

  try {
    if (action === 'approve') {
      await col.doc(workId).update({ data: { status: 'published', publishedAt: now, updatedAt: now } });
      return { ok: true, action, workId, status: 'published' };
    }
    if (action === 'reject') {
      await col.doc(workId).update({ data: { status: 'rejected', updatedAt: now } });
      return { ok: true, action, workId, status: 'rejected' };
    }
    if (action === 'delete') {
      await col.doc(workId).remove();
      return { ok: true, action, workId };
    }
  } catch (e) {
    return { ok: false, code: 'ACTION_FAILED', message: String(e) };
  }

  return { ok: false, code: 'UNKNOWN_ACTION', message: '未知 action' };
};
