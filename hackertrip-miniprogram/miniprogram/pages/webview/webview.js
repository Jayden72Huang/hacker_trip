const { parseAIEntry } = require('../../utils/ai.js');

Page({
  data: {
    title: '官方报名',
    url: '',
  },

  onLoad(options) {
    parseAIEntry(options);
    this.setData({
      title: options.title || '官方报名',
      url: decodeURIComponent(options.url || ''),
    });
  },
});
