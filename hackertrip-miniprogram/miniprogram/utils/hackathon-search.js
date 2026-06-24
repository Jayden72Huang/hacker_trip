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
  return String(value || '')
    .split(/[\/／,，、|｜;；\s]+/)
    .map((item) => item.trim())
    .filter((item) => item && item !== '中国');
}

function getHackathonCities(item) {
  const cities = []
    .concat(getCityTokens(item.city))
    .concat(getCityTokens(item.location));
  return Array.from(new Set(cities));
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
  buildCityOptions,
  matchHackathonCity,
};
