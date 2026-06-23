/**
 * 云开发环境配置。
 *
 * 配置步骤：
 *   1. 在微信开发者工具左上角「云开发」按钮开通云开发（需正式 AppID）
 *   2. 复制环境 ID（形如 hackertrip-7gabc123），填入下方 envId
 *   3. urlCheck 在 project.config.json 中为 true；若调真实 HTTP 接口需配 request 合法域名
 *
 * 未配置 envId 时，全站自动降级为本地 mock 数据（utils/api.js 处理），
 * 在开发者工具里无需任何后端即可跑通全部 UI 与卡片玩法。
 */
module.exports = {
  // 留空 = 走本地 mock 降级；填入真实环境 ID 后自动切换云端
  envId: 'test-1-d8gn28apcbf409627',
  // 官网域名，用于「在网页打开 / 复制链接」等
  webBase: 'https://hackertrip.space',
  // 卡片分享落地页（H5），与小程序卡片同源
  shareBase: 'https://hackertrip.space/u',
};
