Component({
  data: {
    selected: 0,
    color: '#7A7A75',
    selectedColor: '#0C51ED',
    list: [
      { pagePath: '/pages/index/index', text: '发现', icon: 'star' },
      { pagePath: '/pages/schedule/schedule', text: '赛程', icon: 'calendar' },
      { pagePath: '/pages/inbox/inbox', text: '消息', icon: 'chat' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'user-circle' },
    ],
  },

  lifetimes: {
    attached() {
      this.syncSelected();
    },
  },

  pageLifetimes: {
    show() {
      this.syncSelected();
    },
  },

  methods: {
    syncSelected() {
      const pages = getCurrentPages();
      const current = pages.length ? '/' + pages[pages.length - 1].route : '';
      const list = this.data.list;
      let selected = 0;

      for (let i = 0; i < list.length; i += 1) {
        if (list[i].pagePath === current) {
          selected = i;
          break;
        }
      }

      this.setData({ selected });
    },

    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];

      if (!item) return;

      wx.switchTab({
        url: item.pagePath,
      });
    },
  },
});
