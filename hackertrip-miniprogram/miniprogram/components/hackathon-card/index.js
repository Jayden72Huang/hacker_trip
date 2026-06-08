Component({
  properties: {
    item: { type: Object, value: {} },
    bookmarked: { type: Boolean, value: false },
  },
  data: {
    modeLabel: { online: '线上', offline: '线下', hybrid: '线上+线下' },
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.item.id });
    },
    onBookmark(e) {
      // 阻止冒泡到卡片点击
      this.triggerEvent('bookmark', { id: this.data.item.id });
    },
  },
});
