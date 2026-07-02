function cleanCityToken(value) {
  let token = String(value || '').trim();
  if (!token) return '';

  token = token
    .replace(/^中国[\s,，·-]*/, '')
    .replace(/[\s,，·-]*中国$/, '')
    .replace(/^[^A-Za-z0-9\u4e00-\u9fa5]+|[^A-Za-z0-9\u4e00-\u9fa5]+$/g, '');

  const addressCut = token.search(/[·(（@#：:]/);
  if (addressCut > 0) token = token.slice(0, addressCut);
  token = token.trim();

  if (!token || token === '中国') return '';
  if (/^[\u4e00-\u9fa5]{2,6}市$/.test(token)) token = token.slice(0, -1);
  return token;
}

function extractCities(value) {
  const source = String(value || '').trim();
  if (!source) return [];

  return Array.from(new Set(source
    .split(/[\/／,，、|｜;；\s]+/)
    .map(cleanCityToken)
    .filter(Boolean)));
}

function normalizeCity(value, fallback) {
  const cities = extractCities(value);
  if (cities.length) return cities[0];
  const fallbackCities = extractCities(fallback);
  return fallbackCities[0] || '';
}

module.exports = {
  cleanCityToken,
  extractCities,
  normalizeCity,
};
