Component({
  properties: {
    item: { type: Object, value: {} },
    bookmarked: { type: Boolean, value: false },
  },
  data: {
    statusText: {
      upcoming: '即将开始',
      ongoing: '进行中',
      ended: '已结束',
    },
  },
  methods: {
    onBookmark() {
      this.triggerEvent('bookmark', { id: this.data.item.id });
    },
  },
});
