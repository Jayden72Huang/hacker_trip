// 云函数：matchHackathonsByStack —— HackerTrip 核心差异化能力
// 依据 docs/微信AI可调用性规范.md §1.3 缺口①
// 输入用户技术栈/方向，匹配 hackathons 集合的 techStack/tracks/tags 三个数组字段，
// 打分排序后返回 ranked events + fitReason（命中理由）。
//
// 出参遵循 §7 结构化契约：{ ok, data: { list, total }, error }
// 每条 list 元素 = 标准黑客松字段 + { matchScore, matchedTags, fitReason }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 同义词归一表（§3.3 技术栈词表归一）。key 为归一后的标准词，value 为别名。
// 命中任一别名都折算到标准词，提升匹配召回。
const SYNONYMS = {
  AI: ['ai', '人工智能', '大模型', 'llm', 'gpt', 'agent', '机器学习', 'ml', 'aigc', 'ai创作'],
  IoT: ['iot', '物联网', '嵌入式', '硬件', 'hardware', '可穿戴', '机器人', 'robot'],
  Web: ['web', '前端', 'frontend', 'react', 'vue', 'next', 'node', 'nodejs', 'javascript', 'typescript', 'ts', 'js'],
  Mobile: ['mobile', '移动端', 'ios', 'android', 'flutter', '小程序', 'rn', 'reactnative'],
  Python: ['python', '数据', 'data', '数据分析', '后端', 'backend'],
  Web3: ['web3', '区块链', 'blockchain', 'crypto', '链上', 'defi', 'nft'],
  '3D打印': ['3d打印', '3d', '建模', 'cad'],
  社交: ['社交', 'social', '社区', '内容', '内容平台'],
  出海: ['出海', '全球化', 'global', '国际化'],
};

// 把任意标签文本归一为标准词集合（一个文本可能命中多个标准词）
function normalizeToken(raw) {
  if (!raw) return [];
  const t = String(raw).trim().toLowerCase();
  if (!t) return [];
  const hits = new Set();
  for (const std of Object.keys(SYNONYMS)) {
    const aliases = SYNONYMS[std];
    if (std.toLowerCase() === t || aliases.includes(t)) {
      hits.add(std);
      continue;
    }
    // 包含关系兜底：用户输入 "react和node" 这类长串时
    if (aliases.some((a) => a.length >= 2 && t.includes(a))) hits.add(std);
  }
  // 没命中任何标准词时，保留原始小写词，仍可做精确字面匹配
  if (hits.size === 0) hits.add(t);
  return Array.from(hits);
}

// 把一个数组字段归一为标准词集合
function normalizeList(list) {
  const out = new Set();
  (list || []).forEach((x) => normalizeToken(x).forEach((n) => out.add(n)));
  return out;
}

// 由日期推导状态（§3.3 状态归一），不信任手工 isPast
function deriveStatus(item, today) {
  const start = item.startDate || '';
  const end = item.endDate || start;
  if (end && end < today) return 'ended';
  if (start && start > today) return 'upcoming';
  if (start && end && start <= today && today <= end) return 'ongoing';
  // 日期缺失时回退到 isPast 标注
  return item.isPast ? 'ended' : 'upcoming';
}

exports.main = async (event) => {
  const {
    techStack = [],
    city,
    onlyUpcoming = true,
    limit = 10,
  } = event || {};

  // 入参兜底：允许传字符串（AI 可能传 "React, Node, AI"）
  let stackArr = techStack;
  if (typeof techStack === 'string') {
    stackArr = techStack.split(/[,，、;；\s]+/).filter(Boolean);
  }
  if (!Array.isArray(stackArr) || stackArr.length === 0) {
    return { ok: false, data: { list: [], total: 0 }, error: 'techStack 不能为空' };
  }

  const userTokens = normalizeList(stackArr); // Set<标准词>
  const today = new Date().toISOString().slice(0, 10);

  try {
    let query = { isPublished: _.neq(false) };
    if (city && String(city).trim()) {
      query.city = db.RegExp({ regexp: escapeRegExp(String(city).trim().slice(0, 40)), options: 'i' });
    }
    const res = await db.collection('hackathons').where(query).limit(100).get();
    const all = res.data || [];

    const scored = all.map((item) => {
      const status = deriveStatus(item, today);
      // 三字段加权：techStack 权重最高，tracks 次之，tags 最低
      const evTech = normalizeList(item.techStack);
      const evTrack = normalizeList(item.tracks);
      const evTags = normalizeList(item.tags);

      const matched = new Set();
      let score = 0;
      userTokens.forEach((tok) => {
        if (evTech.has(tok)) { score += 3; matched.add(tok); }
        else if (evTrack.has(tok)) { score += 2; matched.add(tok); }
        else if (evTags.has(tok)) { score += 1; matched.add(tok); }
      });

      const matchedTags = Array.from(matched);
      const coverage = userTokens.size ? matched.size / userTokens.size : 0;
      const fitReason = matchedTags.length
        ? `匹配你的 ${matchedTags.join(' / ')} 方向`
        : '';

      return { item, status, score, matchScore: score, matchedTags, coverage, fitReason };
    });

    let list = scored
      .filter((s) => s.score > 0)
      .filter((s) => (onlyUpcoming ? s.status !== 'ended' : true))
      // 先按命中分，再按覆盖率，再按 startDate 升序（近的优先）
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;
        return (a.item.startDate || '') < (b.item.startDate || '') ? -1 : 1;
      })
      .slice(0, Math.min(limit, 50))
      .map((s) => ({
        ...s.item,
        status: s.status,
        matchScore: s.matchScore,
        matchedTags: s.matchedTags,
        fitReason: s.fitReason,
      }));

    return { ok: true, data: { list, total: list.length }, error: null };
  } catch (e) {
    return { ok: false, data: { list: [], total: 0 }, error: String(e) };
  }
};
