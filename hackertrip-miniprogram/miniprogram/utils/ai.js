function parseAIEntry(options) {
  const params = options || {};

  return {
    fromAI: params.src === 'ai',
    intent: params.intent || '',
    params,
    source: params.src || 'direct',
  };
}

module.exports = {
  parseAIEntry,
};
