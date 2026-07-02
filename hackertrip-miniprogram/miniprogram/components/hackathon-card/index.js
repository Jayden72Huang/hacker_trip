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
    onCardTap() {
      this.triggerEvent('tapcard', { id: this.data.item.id });
    },
    onBookmark() {
      this.triggerEvent('bookmark', { id: this.data.item.id });
    },
    onRegister() {
      const item = this.data.item || {};
      this.triggerEvent('register', {
        id: item.id,
        url: item.registerUrl || item.registrationUrl || item.website || '',
        hosted: item.registrationType === 'platform' || item.hostedRegistration === true,
      });
    },
  },
});
