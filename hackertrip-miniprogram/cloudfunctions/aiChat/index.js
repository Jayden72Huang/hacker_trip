// 云函数：aiChat —— Haki 聊天的真实 AI 问答
// 用 @cloudbase/node-sdk 调腾讯云开发内置混元（Hunyuan）大模型，
// 用 wx-server-sdk 读 hackathons 集合，把真实赛事数据注入 system prompt。
// 任何环节失败都降级返回兜底文案，绝不抛错阻断前端。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const tcb = require('@cloudbase/node-sdk');
const tcbApp = tcb.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const PROVIDER = 'hunyuan-exp';
const MODEL = 'hunyuan-2.0-instruct-20251111';
const MAX_HISTORY = 8; // 最多带入的历史对话条数，控制 token

// 兜底文案：AI 不可用时返回，前端无需特殊处理
const FALLBACK_TEXT =
  '我暂时连不上模型，先给你一个方向：把你的技术栈（如 React / AI / 硬件）、城市偏好和组队意向告诉我，我会按赛事的时间、地点、赛道和奖金帮你判断适配度。';

/** 拉取已发布赛事的关键字段，作为 AI 上下文 */
async function loadHackathons() {
  try {
    const res = await db
      .collection('hackathons')
      .where({ isPublished: true })
      .orderBy('startDate', 'desc')
      .limit(20)
      .get();
    return res.data || [];
  } catch (e) {
    console.warn('[aiChat] 读 hackathons 失败，AI 将无赛事上下文', e);
    return [];
  }
}

/** 把赛事压缩成精简文本，避免 token 浪费 */
function buildContext(list) {
  if (!list.length) return '（暂无可用赛事数据）';
  return list
    .map((h, i) => {
      const tracks = (h.tracks || []).join('、') || '未列出';
      const tech = (h.techStack || []).join('、') || '未列出';
      const date =
        h.startDate && h.endDate ? `${h.startDate} 至 ${h.endDate}` : h.startDate || '待定';
      const reg = h.registrationDeadline ? `，报名截止 ${h.registrationDeadline}` : '';
      const status = h.isPast ? '已结束' : '进行中/即将开始';
      return [
        `${i + 1}. ${h.name}（${h.shortName || ''}）`,
        `   城市：${h.city || '线上'}｜形式：${h.mode || '未知'}｜状态：${status}`,
        `   时间：${date}${reg}`,
        `   赛道：${tracks}`,
        `   技术栈：${tech}`,
        `   奖金：${h.prizePool || '未公布'}`,
        `   官网：${h.website || '无'}`,
      ].join('\n');
    })
    .join('\n\n');
}

function buildSystemPrompt(context, focusName) {
  const lines = [
    '你是 Haki，HackerTrip 小程序里的黑客松助手，帮中文用户挑选和准备黑客松比赛。',
    '只依据下面提供的「赛事清单」回答，不要编造清单里没有的赛事、时间、奖金或链接。',
    '回答要点：',
    '- 用简体中文，口语化、简洁，控制在 150 字以内，必要时分点。',
    '- 推荐赛事时给出具体理由（赛道/技术栈/城市/时间/奖金哪一点匹配）。',
    '- 用户问报名时间就报具体日期；信息缺失就如实说"暂未公布"，不要瞎猜。',
    '- 涉及组队角色时，结合用户技术栈给出实用建议。',
  ];
  if (focusName) {
    lines.push(
      '',
      `【当前焦点赛事】用户正在查看「${focusName}」。当用户说"这个比赛""这场""它""在哪里"等指代而未点名具体赛事时，默认就是指「${focusName}」，直接回答它的信息，不要反问是哪个。`,
    );
  }
  lines.push('', '【赛事清单】', context);
  return lines.join('\n');
}

async function loadLatestSync(openid) {
  if (!openid) return null;
  try {
    const res = await db
      .collection('sync_pairs')
      .where({ openid, bound: true })
      .orderBy('boundAt', 'desc')
      .limit(1)
      .get();
    const doc = res.data && res.data[0];
    return doc && doc.scan ? doc.scan : null;
  } catch (e) {
    console.warn('[aiChat] 读取 Skills 同步数据失败', e);
    return null;
  }
}

function buildAgentContext(scan, config) {
  if (!scan || typeof scan !== 'object') return '';
  const cfg = Object.assign({
    projectContext: true,
    techStack: true,
    identityCard: true,
    matchResults: true,
  }, config || {});
  const lines = [];
  const project = scan.project || {};
  const identity = scan.identity || {};
  if (cfg.projectContext && (project.name || project.summary || project.description)) {
    lines.push(`项目画像：${project.name || '未命名项目'} - ${project.summary || project.description || '无简介'}`);
  }
  const stack = project.techStack || identity.techStack || scan.techStack || [];
  if (cfg.techStack && Array.isArray(stack) && stack.length) {
    lines.push(`技术栈：${stack.slice(0, 16).join('、')}`);
  }
  if (cfg.identityCard && identity.role) {
    lines.push(`身份卡角色：${identity.role}；组队状态：${identity.lookingFor || '未设置'}；打法：${identity.playStyle || '未设置'}`);
  }
  if (cfg.matchResults && Array.isArray(scan.matches) && scan.matches.length) {
    lines.push(`已同步匹配结果：${scan.matches.slice(0, 5).map((m) => `${m.name || m.title || m.id || '赛事'}${m.reason ? `(${m.reason})` : ''}`).join('；')}`);
  }
  if (!lines.length) return '';
  return ['【用户已授权的 Agent 上下文】', ...lines].join('\n');
}

async function checkMessageContent(openid, message) {
  if (!openid) return { ok: false, reply: '缺少用户身份，暂时无法发送消息。', fallback: true };
  try {
    const security = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: 1,
      version: 2,
      content: String(message || '').slice(0, 1000),
      title: 'Haki chat',
    });
    const suggest = security && security.result && security.result.suggest;
    if (security.errcode && security.errcode !== 0) {
      return { ok: false, reply: '内容安全检测失败，请稍后重试。', fallback: true };
    }
    if (suggest === 'risky') {
      return { ok: false, reply: '这条消息暂时无法处理，请调整内容后再试。', fallback: true };
    }
  } catch (e) {
    return { ok: false, reply: '内容安全检测失败，请稍后重试。', fallback: true };
  }
  return null;
}

/** 归一化前端传来的对话历史 */
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && (m.content || m.text))
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: String(m.content || m.text).slice(0, 1000) }));
}

/**
 * 组装注入了真实赛事 context 的完整 messages 数组。
 * 赛事过滤(isPublished)只能在云端做，所以 prompt 装配必须留在云函数。
 */
async function buildMessages(message, history, focusEventId, openid, agentConfig) {
  let context = '（暂无可用赛事数据）';
  let focusName = '';
  let agentContext = '';
  try {
    const list = await loadHackathons();
    context = buildContext(list);
    if (focusEventId) {
      const f = list.find((h) => h.id === focusEventId);
      if (f) focusName = f.name;
    }
  } catch (e) {
    console.warn('[aiChat] 构建赛事上下文失败', e);
  }
  try {
    agentContext = buildAgentContext(await loadLatestSync(openid), agentConfig);
  } catch (e) {
    agentContext = '';
  }
  const system = agentContext
    ? `${buildSystemPrompt(context, focusName)}\n\n${agentContext}`
    : buildSystemPrompt(context, focusName);
  return [
    { role: 'system', content: system },
    ...normalizeHistory(history),
    { role: 'user', content: message.slice(0, 1000) },
  ];
}

exports.main = async (event) => {
  const message = String((event && event.message) || '').trim();
  if (!message) {
    return { ok: false, reply: '说点什么吧，比如"我会 React，适合参加哪个？"', fallback: true };
  }

  const openid = (cloud.getWXContext() || {}).OPENID;
  const securityError = await checkMessageContent(openid, message);
  if (securityError) return securityError;

  const messages = await buildMessages(
    message,
    event && event.history,
    event && event.focusEventId,
    openid,
    event && event.agentConfig,
  );

  // mode=prepare：仅返回装配好的 messages，由小程序端用 wx.cloud.extend.AI 做流式生成
  // （云函数 callFunction 是一次性 RPC，无法把 streamText 的增量 token 推回小程序）
  if (event && event.mode === 'prepare') {
    return { ok: true, mode: 'prepare', provider: PROVIDER, model: MODEL, messages };
  }

  // 默认 mode=generate：云函数内非流式生成，作为前端流式不可用时的降级路径
  try {
    const ai = tcbApp.ai();
    const model = ai.createModel(PROVIDER);
    const result = await model.generateText({ model: MODEL, messages });
    const text = (result && result.text && result.text.trim()) || '';
    if (!text) {
      return { ok: false, reply: FALLBACK_TEXT, fallback: true };
    }
    return { ok: true, reply: text, usage: result.usage || null };
  } catch (e) {
    console.error('[aiChat] 调用混元失败，降级兜底', e);
    return { ok: false, reply: FALLBACK_TEXT, fallback: true, error: String(e && e.message || e) };
  }
};
