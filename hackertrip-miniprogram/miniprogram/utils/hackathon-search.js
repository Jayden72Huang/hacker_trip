const { extractCities, normalizeCity } = require('./city.js');

function normalizeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getSearchTokens(query) {
  return normalizeText(query)
    .split(/[\s,，、]+/)
    .filter(Boolean);
}

function getHackathonSearchText(item) {
  return normalizeText([
    item.name,
    item.shortName,
    item.city,
    item.location,
    item.modeText,
    item.theme,
    item.summary,
    item.prizePool,
    ...(item.tracks || []),
    ...(item.techStack || []),
    ...(item.tags || []),
  ].join(' '));
}

function matchHackathonQuery(item, query) {
  const tokens = getSearchTokens(query);
  if (!tokens.length) return true;
  const text = getHackathonSearchText(item);
  return tokens.every((token) => text.indexOf(token) !== -1);
}

function getCityTokens(value) {
  return extractCities(value);
}

function getHackathonCities(item) {
  return getCityTokens(item.city || normalizeCity(item.city, item.location));
}

function buildCityOptions(list) {
  const cities = [];
  (list || []).forEach((item) => {
    getHackathonCities(item).forEach((city) => {
      if (cities.indexOf(city) === -1) cities.push(city);
    });
  });
  return ['全国'].concat(cities);
}

function matchHackathonCity(item, city) {
  if (!city || city === '全国') return true;
  return getHackathonCities(item).indexOf(city) !== -1;
}

module.exports = {
  normalizeText,
  getSearchTokens,
  matchHackathonQuery,
  getHackathonCities,
  normalizeCity,
  buildCityOptions,
  matchHackathonCity,
};
