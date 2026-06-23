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

// 卡片列表 → 给 LLM 的文本上下文
function cardsToText(cards, hint) {
  if (!cards.length) return `没有找到${hint ? `「${hint}」相关的` : ''}黑客松。`;
  const lines = cards.map((c, i) => {
    const st = STATUS_CN[c.status] || '';
    return `${i + 1}. ${c.title}（${st}）｜${c.subtitle}｜奖金：${c.highlight || '待确认'}｜${c.body}`;
  });
  return `为你找到 ${cards.length} 场黑客松：\n${lines.join('\n')}`;
}

// 匹配结果 → 文本（带 fitReason）
function matchedCardsToText(cards, techStack) {
  const ts = Array.isArray(techStack) ? techStack.join('、') : techStack;
  if (!cards.length) return `没有匹配到适合「${ts}」的黑客松，可以换个方向或扩大范围试试。`;
  const lines = cards.map((c, i) => {
    const st = STATUS_CN[c.status] || '';
    const reason = c.fitReason ? `｜${c.fitReason}` : '';
    return `${i + 1}. ${c.title}（${st}）${reason}｜${c.subtitle}｜奖金：${c.highlight || '待确认'}`;
  });
  return `根据你的技术栈「${ts}」，最匹配的 ${cards.length} 场黑客松：\n${lines.join('\n')}`;
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
  return parts.filter(Boolean).join('\n');
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
