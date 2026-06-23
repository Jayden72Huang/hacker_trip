// 云函数：登录 —— 返回当前用户 openid（云开发自动注入 WXContext，无需 code 换取）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();
  const userInfo = (event && event.userInfo) || null;

  // 落库/更新用户档案（openid 关联），供 getProfile/公开主页复用
  if (OPENID) {
    try {
      const col = db.collection('users');
      const existed = await col.where({ openid: OPENID }).limit(1).get();
      const now = Date.now();
      const patch = {
        openid: OPENID,
        lastLoginAt: now,
      };
      if (userInfo) {
        if (userInfo.nickName) patch.nickname = userInfo.nickName;
        if (userInfo.avatarUrl) patch.avatarUrl = userInfo.avatarUrl;
      }
      if (existed.data && existed.data.length) {
        await col.doc(existed.data[0]._id).update({ data: patch });
      } else {
        await col.add({ data: Object.assign({ createdAt: now }, patch) });
      }
    } catch (e) {
      // 落库失败不阻断登录（前端仍可拿到 openid）
      console.warn('[login] users upsert 失败', e);
    }
  }

  return { ok: true, openid: OPENID, appid: APPID, unionid: UNIONID || null };
};
