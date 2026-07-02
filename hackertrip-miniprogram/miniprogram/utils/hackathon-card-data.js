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

function decorateCardItem(item) {
  const heat = api.getLocalHackathonHeat(item.id);
  const bookmarkCount = heat && heat.ok ? heat.bookmarks : 0;
  return Object.assign({}, item, {
    bookmarked: api.isBookmarked(item.id),
    heatValue: heat && heat.ok ? heat.heat : 0,
    heatText: heat && heat.ok ? String(heat.heat) : '0',
    bookmarkCount,
    bookmarkCountText: String(bookmarkCount),
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
