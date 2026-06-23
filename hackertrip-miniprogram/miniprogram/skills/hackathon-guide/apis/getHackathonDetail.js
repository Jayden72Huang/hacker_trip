// 原子接口：getHackathonDetail —— 返回单场赛事完整信息
const { toDetail, detailToText, withCloud } = require('../lib/shared.js');

async function getHackathonDetail({ id } = {}) {
  if (!id) {
    return {
      isError: true,
      content: [{ type: 'text', text: '缺少赛事 id，无法查询详情。' }],
      structuredContent: { hackathon: null, error: 'id 不能为空' },
    };
  }
  try {
    const cloud = withCloud();
    const res = await cloud.callFunction({
      name: 'getHackathonDetail',
      data: { id },
    });
    const hackathon = (res && res.result && res.result.hackathon) || null;
    if (!hackathon) {
      return {
        isError: false,
        content: [{ type: 'text', text: '没有找到这场黑客松，可能已下架或 id 有误。' }],
        structuredContent: { hackathon: null },
      };
    }
    const detail = toDetail(hackathon);
    return {
      isError: false,
      content: [{ type: 'text', text: detailToText(detail) }],
      structuredContent: { hackathon: detail },
    };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: '查询赛事详情失败，请稍后再试。' }],
      structuredContent: { hackathon: null, error: String(e) },
    };
  }
}

module.exports = getHackathonDetail;
