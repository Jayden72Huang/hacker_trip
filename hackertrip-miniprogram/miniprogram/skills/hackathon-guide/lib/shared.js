// SKILL 共享工具：数据归一 + 文本化 + cloud 句柄
// 依据 docs/微信AI可调用性规范.md §3 数据 schema / §4 卡片 schema

const MODE_CN = { offline: '线下', online: '线上', hybrid: '线上+线下' };
const STATUS_CN = { upcoming: '即将开始', ongoing: '进行中', ended: '已结束' };

// 拿到 wx.cloud 句柄（独立 JS 环境内 wx.cloud 可用；首次需 init）
let _inited = false;
function withCloud() {
  if (!_inited && typeof wx !== 'undefined' && wx.cloud && wx.cloud.init) {
    try {
      wx.cloud.init({ env: 'test-1-d8gn28apcbf409627', traceUser: true });
    } catch (e) {}
    _inited = true;
  }
  return wx.cloud;
}

// 由日期推导状态（与云函数保持一致，前端兜底）
function deriveStatus(item) {
  const today = new Date().toISOString().slice(0, 10);
  const start = item.startDate || '';
  const end = item.endDate || start;
  if (end && end < today) return 'ended';
  if (start && start > today) return 'upcoming';
  if (start && end && start <= today && today <= end) return 'ongoing';
  return item.isPast ? 'ended' : 'upcoming';
}

// 标准黑客松实体 → HackathonCard（§4）
function toCard(item) {
  const status = item.status || deriveStatus(item);
  const loc = item.location || item.city || '地点待定';
  const mode = MODE_CN[item.mode] || '';
  return {
    id: item.id,
    title: item.shortName || item.name,
    subtitle: [item.startDate, loc, mode].filter(Boolean).join(' · '),
    highlight: item.prizePool || '',
    tags: (item.techStack || []).slice(0, 3),
    body: item.summary || '',
    status,
    // 稳定 deep-link（公开契约，恒接受 src/intent）
    deeplink: `/pages/detail/detail?id=${item.id}&src=ai`,
    website: item.website || '',
  };
}

// 完整详情（§3 全字段文本化）
function toDetail(item) {
  return {
    id: item.id,
    name: item.name,
    shortName: item.shortName,
    startDate: item.startDate,
    endDate: item.endDate,
    registrationDeadline: item.registrationDeadline || null,
    city: item.city,
    country: item.country,
    location: item.location,
    mode: item.mode,
    modeText: MODE_CN[item.mode] || '',
    theme: item.theme,
    tracks: item.tracks || [],
    techStack: item.techStack || [],
    tags: item.tags || [],
    prizePool: item.prizePool,
    summary: item.summary,
    website: item.website,
    status: item.status || deriveStatus(item),
    deeplink: `/pages/detail/detail?id=${item.id}&src=ai`,
  };
}

// 卡片列表 → 给微信 AI 的决策上下文：事实 + 下一步动作
function cardsToText(cards, hint) {
  if (!cards.length) {
    return [
      `未找到${hint ? `「${hint}」相关的` : ''}黑客松，当前返回列表为空。`,
      '请告诉用户没有找到匹配结果，并引导用户换一个城市、主题、技术方向，或改用 matchHackathonsByStack 按技术栈匹配。',
      '不要用相同参数重复调用 searchHackathons。',
    ].join('\n');
  }
  const lines = cards.map((c, i) => {
    const st = STATUS_CN[c.status] || '';
    return `${i + 1}. ${c.title}（${st}）｜${c.subtitle}｜奖金：${c.highlight || '待确认'}｜${c.body}`;
  });
  return [
    `已找到 ${cards.length} 场黑客松，结构化卡片列表已放在 structuredContent.list。`,
    lines.join('\n'),
    '请先展示这些赛事卡片，并用一句话引导用户选择一场查看详情；用户选定后再用 getHackathonDetail，并使用上游返回的 id 原值。',
  ].join('\n');
}

// 匹配结果 → 文本（带 fitReason）
function matchedCardsToText(cards, techStack) {
  const ts = Array.isArray(techStack) ? techStack.join('、') : techStack;
  if (!cards.length) {
    return [
      `未匹配到适合「${ts || '当前技术栈'}」的黑客松，当前返回列表为空。`,
      '请告诉用户没有匹配结果，并建议补充更多技术栈、项目方向、城市偏好，或改用 searchHackathons 浏览近期赛事。',
      '不要编造赛事，也不要用相同 techStack 重复调用 matchHackathonsByStack。',
    ].join('\n');
  }
  const lines = cards.map((c, i) => {
    const st = STATUS_CN[c.status] || '';
    const reason = c.fitReason ? `｜${c.fitReason}` : '';
    return `${i + 1}. ${c.title}（${st}）${reason}｜${c.subtitle}｜奖金：${c.highlight || '待确认'}`;
  });
  return [
    `已根据技术栈「${ts}」匹配到 ${cards.length} 场黑客松，结果已按匹配度排序并放在 structuredContent.list。`,
    lines.join('\n'),
    '请展示匹配结果卡片和 fitReason；用户想深入某场赛事时，再用 getHackathonDetail，并使用上游返回的 id 原值。',
  ].join('\n');
}

// 详情 → 文本
function detailToText(d) {
  const parts = [
    `${d.name}（${STATUS_CN[d.status] || ''}）`,
    `时间：${d.startDate || '待定'} ~ ${d.endDate || '待定'}`,
    `地点：${d.location || d.city || '待定'}（${d.modeText}）`,
    d.theme ? `主题：${d.theme}` : '',
    (d.tracks || []).length ? `赛道：${d.tracks.join('、')}` : '',
    (d.techStack || []).length ? `技术栈：${d.techStack.join('、')}` : '',
    `奖金：${d.prizePool || '待确认'}`,
    d.registrationDeadline ? `报名截止：${d.registrationDeadline}` : '',
    d.summary ? `简介：${d.summary}` : '',
    d.website ? `官网：${d.website}` : '',
  ];
  return [
    `已查到赛事详情：${d.name || d.id}。`,
    parts.filter(Boolean).join('\n'),
    '请向用户概括时间、地点、赛道、奖金和报名截止；如用户要报名，只引导打开官网或小程序详情页，不要宣称已代用户报名。',
  ].join('\n');
}

module.exports = {
  withCloud,
  toCard,
  toDetail,
  cardsToText,
  matchedCardsToText,
  detailToText,
  deriveStatus,
};
