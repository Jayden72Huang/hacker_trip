// 原子接口：searchHackathons —— 在微信客户端独立 JS 环境运行
// 调用云函数 getHackathons，将结果归一为 HackathonCard 契约返回给微信 AI。
// 返回结构遵循官方原子接口规范：{ isError, content, structuredContent }
const { toCard, cardsToText, withCloud } = require('../lib/shared.js');

async function searchHackathons({ q, mode, status, limit = 8 } = {}) {
  try {
    const cloud = withCloud();
    const res = await cloud.callFunction({
      name: 'getHackathons',
      data: { q, mode, status, limit },
    });
    const list = (res && res.result && res.result.list) || [];
    const cards = list.map(toCard);
    return {
      isError: false,
      content: [{ type: 'text', text: cardsToText(cards, q || mode || status) }],
      structuredContent: { list: cards, total: cards.length },
    };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: '搜索黑客松失败，请稍后再试。' }],
      structuredContent: { list: [], total: 0, error: String(e) },
    };
  }
}

module.exports = searchHackathons;
