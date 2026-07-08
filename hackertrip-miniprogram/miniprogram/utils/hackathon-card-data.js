const api = require('./api.js');

const SORT_OPTIONS = [
  { key: 'heat', label: '热度优先' },
  { key: 'time', label: '时间最近' },
];

function dateValue(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function getSortLabel(key) {
  const option = SORT_OPTIONS.find((item) => item.key === key);
  return option ? option.label : SORT_OPTIONS[0].label;
}

/**
 * 装饰列表卡片。heatMap 为 api.getHackathonHeatMap 拉到的真实热度；
 * 没有真值时热度/订阅数留空不展示（不再用 hash 拟真假数据）。
 */
function decorateCardItem(item, heatMap) {
  const heat = heatMap && heatMap[item.id];
  return Object.assign({}, item, {
    bookmarked: api.isBookmarked(item.id),
    heatValue: heat ? heat.heat : 0,
    heatText: heat ? String(heat.heat) : '',
    bookmarkCount: heat ? heat.bookmarks : 0,
    bookmarkCountText: heat && heat.bookmarks ? String(heat.bookmarks) : '',
    cityText: item.city || '待确认',
    locationText: item.location || item.city || '待确认',
    dateText: item.startDate
      ? `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`
      : '待确认',
    prizeText: item.prizePool || '待确认',
    registerUrl: item.registrationUrl || item.website || '',
  });
}

function sortCardItems(list, sortKey) {
  const key = sortKey || 'heat';
  const next = (list || []).slice();
  if (key === 'time') {
    next.sort((a, b) => dateValue(a.startDate) - dateValue(b.startDate));
  } else {
    // 热度优先：真实热度降序，无热度按时间最近兜底
    next.sort((a, b) => {
      const diff = Number(b.heatValue || 0) - Number(a.heatValue || 0);
      return diff || dateValue(a.startDate) - dateValue(b.startDate);
    });
  }
  return next;
}

module.exports = {
  SORT_OPTIONS,
  decorateCardItem,
  sortCardItems,
  getSortLabel,
};
