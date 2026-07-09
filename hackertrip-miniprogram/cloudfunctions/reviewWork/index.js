// 云函数：用户自审作品（个人主页作品发布控制）。
// 需 openid。用户只能操作自己名下的 works，不能碰别人的。
//   action='list'    —— 列出当前用户所有作品（含 status: pending|published|rejected）
//   action='save'    —— 手动新建/编辑作品（event.work 字段，event.workId 有值时为编辑）
//   action='approve' —— 发布作品（status -> published），才会出现在公开个人主页
//   action='reject'  —— 下架作品（status -> rejected）
//   action='delete'  —— 删除作品
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanId(v) {
  return String(v == null ? '' : v).trim().slice(0, 80);
}

function cleanText(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 200);
}

function cleanUrl(v) {
  const url = cleanText(v, 300);
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : '';
}

function cleanList(v, maxItems, maxLen) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => cleanText(x, maxLen || 30)).filter(Boolean).slice(0, maxItems || 12);
}

// 用户手填文本走内容安全校验；87014=含风险内容需拦截，其他错误(如未配权限)不阻断
async function passesSecCheck(text) {
  const content = cleanText(text, 4900);
  if (!content) return true;
  try {
    await cloud.openapi.security.msgSecCheck({ content });
    return true;
  } catch (e) {
    if (e && (e.errCode === 87014 || e.errcode === 87014)) return false;
    console.warn('[reviewWork] msgSecCheck skipped', e && (e.errMsg || e.message));
    return true;
  }
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

  // 手动新建/编辑作品（小程序端表单，与 CLI publish-work 写入同一 works 集合）
  if (action === 'save') {
    const input = (event && event.work) || {};
    const name = cleanText(input.name, 60);
    if (!name) return { ok: false, code: 'INVALID_WORK', message: '作品名称必填' };
    const repo = cleanUrl(input.repo);
    const demo = cleanUrl(input.demo);
    if ((cleanText(input.repo, 300) && !repo) || (cleanText(input.demo, 300) && !demo)) {
      return { ok: false, code: 'INVALID_LINK', message: '链接需以 http:// 或 https:// 开头' };
    }
    const patch = {
      name,
      summary: cleanText(input.summary, 200),
      awards: cleanText(input.awards, 80),
      repo,
      demo,
      techStack: cleanList(input.techStack, 12, 30),
      updatedAt: now,
    };
    const safe = await passesSecCheck([patch.name, patch.summary, patch.awards].filter(Boolean).join('\n'));
    if (!safe) return { ok: false, code: 'RISKY_CONTENT', message: '内容含违规信息，请修改后再提交' };

    const editId = cleanId(event && event.workId);
    try {
      if (editId) {
        const existed = await col.doc(editId).get().catch(() => null);
        if (!existed || !existed.data) return { ok: false, code: 'WORK_NOT_FOUND', message: '作品不存在' };
        if (existed.data.openid !== openid) return { ok: false, code: 'FORBIDDEN', message: '只能管理自己的作品' };
        await col.doc(editId).update({ data: patch });
        return { ok: true, action, workId: editId, status: existed.data.status || 'pending' };
      }
      const added = await col.add({
        data: Object.assign({ openid, status: 'pending', source: 'manual', createdAt: now }, patch),
      });
      return { ok: true, action, workId: added._id, status: 'pending' };
    } catch (e) {
      return { ok: false, code: 'SAVE_FAILED', message: String(e) };
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
