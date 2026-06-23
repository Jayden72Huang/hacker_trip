// 原子接口：matchHackathonsByStack —— HackerTrip 核心差异化能力
// 调用同名云函数，按技术栈匹配赛事并返回带 fitReason 的 ranked 卡片。
const { toCard, matchedCardsToText, withCloud } = require('../lib/shared.js');

async function matchHackathonsByStack({ techStack, city, onlyUpcoming = true, limit = 6 } = {}) {
  if (!techStack || (Array.isArray(techStack) && techStack.length === 0)) {
    return {
      isError: true,
      content: [{ type: 'text', text: '请先告诉我你的技术栈或项目方向，例如 React、AI、IoT。' }],
      structuredContent: { list: [], total: 0, error: 'techStack 不能为空' },
    };
  }
  try {
    const cloud = withCloud();
    const res = await cloud.callFunction({
      name: 'matchHackathonsByStack',
      data: { techStack, city, onlyUpcoming, limit },
    });
    const data = (res && res.result && res.result.data) || { list: [], total: 0 };
    const cards = (data.list || []).map((item) => ({
      ...toCard(item),
      matchScore: item.matchScore,
      matchedTags: item.matchedTags,
      fitReason: item.fitReason,
    }));
    return {
      isError: false,
      content: [{ type: 'text', text: matchedCardsToText(cards, techStack) }],
      structuredContent: { list: cards, total: cards.length },
    };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: '匹配黑客松失败，请稍后再试。' }],
      structuredContent: { list: [], total: 0, error: String(e) },
    };
  }
}

module.exports = matchHackathonsByStack;
