// 云函数：保存当前用户的 Agent 上下文授权配置
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const DEFAULT_CONFIG = {
  projectContext: true,
  techStack: true,
  identityCard: true,
  matchResults: true,
};

function normalizeConfig(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const next = {};
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    next[key] = typeof raw[key] === 'boolean' ? raw[key] : DEFAULT_CONFIG[key];
  });
  return next;
}

exports.main = async (event) => {
  const openid = (cloud.getWXContext() || {}).OPENID;
  if (!openid) return { ok: false, message: '缺少用户身份' };

  const agentConfig = normalizeConfig(event && event.agentConfig);
  const now = Date.now();
  const col = db.collection('users');
  try {
    const existed = await col.where({ openid }).limit(1).get();
    const patch = { openid, agentConfig, agentConfigUpdatedAt: now };
    if (existed.data && existed.data[0]) {
      await col.doc(existed.data[0]._id).update({ data: patch });
    } else {
      await col.add({ data: Object.assign({ createdAt: now }, patch) });
    }
    return { ok: true, agentConfig };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
};
