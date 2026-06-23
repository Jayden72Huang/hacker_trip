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

function buildSystemPrompt(context) {
  return [
    '你是 Haki，HackerTrip 小程序里的黑客松助手，帮中文用户挑选和准备黑客松比赛。',
    '只依据下面提供的「赛事清单」回答，不要编造清单里没有的赛事、时间、奖金或链接。',
    '回答要点：',
    '- 用简体中文，口语化、简洁，控制在 150 字以内，必要时分点。',
    '- 推荐赛事时给出具体理由（赛道/技术栈/城市/时间/奖金哪一点匹配）。',
    '- 用户问报名时间就报具体日期；信息缺失就如实说"暂未公布"，不要瞎猜。',
    '- 涉及组队角色时，结合用户技术栈给出实用建议。',
    '',
    '【赛事清单】',
    context,
  ].join('\n');
}

/** 归一化前端传来的对话历史 */
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && (m.content || m.text))
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: String(m.content || m.text).slice(0, 1000) }));
}

exports.main = async (event) => {
  const message = String((event && event.message) || '').trim();
  if (!message) {
    return { ok: false, reply: '说点什么吧，比如"我会 React，适合参加哪个？"', fallback: true };
  }

  let context = '（暂无可用赛事数据）';
  try {
    context = buildContext(await loadHackathons());
  } catch (e) {
    console.warn('[aiChat] 构建赛事上下文失败', e);
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...normalizeHistory(event && event.history),
    { role: 'user', content: message.slice(0, 1000) },
  ];

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
