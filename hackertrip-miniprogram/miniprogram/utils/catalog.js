const hackathons = require('../data/hackathons.js');
const { normalizeCity } = require('./city.js');

const MODE_TEXT = {
  offline: '线下',
  online: '线上',
  hybrid: '混合',
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function deriveStatus(item, today) {
  if (item.endDate && today > item.endDate) return 'ended';
  if (item.startDate && today < item.startDate) return 'upcoming';
  return 'ongoing';
}

function decorate(item, today) {
  const status = deriveStatus(item, today);
  const city = normalizeCity(item.city, item.location) || item.city || '';

  return {
    ...item,
    city,
    location: item.location || item.city || '',
    status,
    canRegister: status !== 'ended',
    modeText: MODE_TEXT[item.mode] || item.mode || '待确认',
  };
}

function getAll(opts) {
  const options = opts || {};
  const today = options.today || formatDate(new Date());
  const list = hackathons.map((item) => decorate(item, today));

  if (options.includeEnded) return list;

  return list.filter((item) => item.status !== 'ended');
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[·｜|/]+/g, '-');
}

function getById(id) {
  const today = formatDate(new Date());
  const key = normalizeKey(id);
  const item = hackathons.find((entry) => {
    return normalizeKey(entry.id) === key
      || normalizeKey(entry.shortName) === key
      || normalizeKey(entry.name) === key;
  });

  return item ? decorate(item, today) : null;
}

module.exports = {
  getAll,
  getById,
  // 导出装饰器供 api 层对云端数据做统一的 status 派生
  decorate,
  deriveStatus,
  formatDate,
};
