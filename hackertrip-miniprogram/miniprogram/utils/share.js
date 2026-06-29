const SHARE_IMAGE = '/images/logo-transparent.png';
const HOME_SHARE_TITLE = 'HackerTrip｜挖掘好玩黑客松,分享你的AI身份卡!';

function enableShareMenu() {
  if (!wx.showShareMenu) return;
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

function buildHomeShare() {
  return {
    title: HOME_SHARE_TITLE,
    path: '/pages/index/index',
    imageUrl: SHARE_IMAGE,
  };
}

function buildScheduleShare() {
  return {
    title: 'HackerTrip 赛程｜管理你的黑客松参赛路线',
    path: '/pages/schedule/schedule',
    imageUrl: SHARE_IMAGE,
  };
}

function buildInboxShare() {
  return {
    title: 'HackerTrip 提醒｜订阅黑客松上新和截止通知',
    path: '/pages/inbox/inbox',
    imageUrl: SHARE_IMAGE,
  };
}

function buildProfileShare() {
  return {
    title: 'HackerTrip 我的主页｜展示技能、作品和身份卡',
    path: '/pages/profile/profile',
    imageUrl: SHARE_IMAGE,
  };
}

function buildListShare(params) {
  const source = params || {};
  const query = [];
  if (source.city && source.city !== '全国') query.push(`city=${encodeURIComponent(source.city)}`);
  if (source.q) query.push(`q=${encodeURIComponent(source.q)}`);
  if (source.filter && source.filter !== 'all') query.push(`filter=${encodeURIComponent(source.filter)}`);
  return {
    title: 'HackerTrip｜发现适合你的黑客松赛事',
    path: `/pages/hackathon-list/hackathon-list${query.length ? `?${query.join('&')}` : ''}`,
    imageUrl: SHARE_IMAGE,
  };
}

function buildDetailShare(item) {
  const hackathon = item || {};
  const name = hackathon.name || 'HackerTrip 黑客松';
  const date = hackathon.dateText || [hackathon.startDate, hackathon.endDate].filter(Boolean).join(' - ');
  return {
    title: date ? `${name} · ${date}` : name,
    path: `/pages/detail/detail?id=${encodeURIComponent(hackathon.id || '')}`,
    imageUrl: SHARE_IMAGE,
  };
}

function timelinePayload(share) {
  const path = share.path || '/pages/index/index';
  const query = path.indexOf('?') === -1 ? '' : path.slice(path.indexOf('?') + 1);
  return {
    title: share.title,
    query,
    imageUrl: share.imageUrl || SHARE_IMAGE,
  };
}

function copyShareText(item) {
  const hackathon = item || {};
  const name = hackathon.name || 'HackerTrip 黑客松';
  const path = hackathon.id
    ? `/pages/detail/detail?id=${encodeURIComponent(hackathon.id)}`
    : '/pages/index/index';
  const lines = [
    name,
    `小程序路径：${path}`,
  ];
  if (hackathon.website) lines.push(`官网链接：${hackathon.website}`);
  return lines.join('\n');
}

module.exports = {
  SHARE_IMAGE,
  enableShareMenu,
  buildHomeShare,
  buildScheduleShare,
  buildInboxShare,
  buildProfileShare,
  buildListShare,
  buildDetailShare,
  timelinePayload,
  copyShareText,
};
