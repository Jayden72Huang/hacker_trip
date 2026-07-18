const api = require('../../utils/api.js');

const LEVELS = ['participant', 'finalist', 'award', 'mentor', 'judge', 'guest'];
const LEVEL_TEXT = {
  participant: '已参赛',
  finalist: '入围',
  award: '获奖',
  mentor: '导师',
  judge: '评委',
  guest: '嘉宾',
};

Page({
  data: {
    title: '发布奖杯',
    isApproved: false,
    levelOptions: LEVELS.map((v) => LEVEL_TEXT[v]),
    // 批量发奖杯
    batchForm: { eventId: '', eventName: '', title: '', level: 'award' },
    batchLevelLabel: '获奖',
    namesText: '',
    namesPlaceholder: '张三\n李四,最佳创意奖\n王五',
    certImage: '', // 奖状图片临时路径（可选，随每张奖杯下发）
    issuing: false,
    issued: [], // 本次发布结果 [{recipientName, code}]
    certs: [], // 历史发出的奖杯
    certsLoaded: false,
    // 手动验证（兜底）
    showManual: false,
    submitting: false,
    levelLabel: '获奖',
    form: {
      eventId: '',
      eventName: '',
      targetUid: '',
      title: '',
      level: 'award',
    },
  },

  async onLoad(options) {
    const eventId = (options && (options.eventId || options.id)) || '';
    const eventName = (options && options.eventName) || '';
    const form = Object.assign({}, this.data.form, {
      eventId,
      eventName,
      targetUid: (options && (options.uid || options.targetUid)) || '',
    });
    const batchForm = Object.assign({}, this.data.batchForm, { eventId, eventName });
    this.setData({ form, batchForm });
    this.refresh();
  },

  /** 本地缓存先渲染认证态；options.wait=true 时强制等云端同步完成（提交前校验，需绕过节流） */
  async refresh(options) {
    this.setData({ isApproved: api.isOrganizerApproved() });
    if (!api.isLoggedIn()) return;
    const wait = !!(options && options.wait);
    const sync = api.syncUserDataIfLoggedIn(wait ? { force: true } : undefined)
      .catch(() => {})
      .then(() => {
        this.setData({ isApproved: api.isOrganizerApproved() });
        if (this.data.isApproved && !this.data.certsLoaded) this.loadCerts();
      });
    if (wait) await sync;
  },

  /** 拉取自己发出的证书和领取状态 */
  async loadCerts() {
    const res = await api.listIssuedCertificates().catch(() => null);
    if (res && res.ok && Array.isArray(res.certificates)) {
      this.setData({
        certs: res.certificates.map((item) => Object.assign({}, item, {
          levelText: LEVEL_TEXT[item.level] || item.level,
          claimed: item.status === 'claimed',
        })),
        certsLoaded: true,
      });
    }
  },

  /* ---------------- 批量发奖杯 ---------------- */

  onBatchInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`batchForm.${field}`]: e.detail.value });
  },

  onNamesInput(e) {
    this.setData({ namesText: e.detail.value });
  },

  onBatchLevelChange(e) {
    const value = LEVELS[Number(e.detail.value)] || 'award';
    this.setData({ 'batchForm.level': value, batchLevelLabel: LEVEL_TEXT[value] });
  },

  /** 奖状图片（可选）：随每张奖杯下发，选手领取后可在履历里查看 */
  async chooseCertImage() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] });
      const file = res && res.tempFiles && res.tempFiles[0];
      if (file && file.tempFilePath) this.setData({ certImage: file.tempFilePath });
    } catch (e) { /* 用户取消 */ }
  },

  removeCertImage() {
    this.setData({ certImage: '' });
  },

  previewCertImage(e) {
    const src = e.currentTarget.dataset.src;
    if (src) wx.previewImage({ urls: [src] });
  },

  /** 解析名单：每行「名字」或「名字,奖项」，奖项省略时用默认奖项标题 */
  parseNames() {
    return this.data.namesText
      .split(/\n/)
      .map((line) => {
        const parts = line.split(/[,，|｜]/).map((s) => s.trim());
        return { name: parts[0] || '', title: parts.slice(1).filter(Boolean).join(' ') };
      })
      .filter((item) => item.name);
  },

  async submitBatch() {
    if (this.data.issuing) return;
    const auth = await api.requireAuth(this, '/pages/organizer-verify/organizer-verify', '登录并通过组织者认证后才能发布奖杯。');
    if (!auth) return;
    await this.refresh({ wait: true });
    if (!this.data.isApproved) {
      wx.showModal({ title: '需要组织者认证', content: '只有已认证主办方可以发布电子奖杯。', showCancel: false });
      return;
    }
    const { eventId, eventName, title, level } = this.data.batchForm;
    const recipients = this.parseNames();
    if (!eventName.trim()) {
      wx.showToast({ title: '请填写赛事名称', icon: 'none' });
      return;
    }
    if (!recipients.length) {
      wx.showToast({ title: '请填写获奖名单，一行一个', icon: 'none' });
      return;
    }
    if (recipients.length > 100) {
      wx.showModal({
        title: '名单超出上限',
        content: `一次最多发布 100 座奖杯，当前名单 ${recipients.length} 人，请分批发布。`,
        showCancel: false,
      });
      return;
    }
    if (!title.trim() && recipients.some((item) => !item.title)) {
      wx.showToast({ title: '请填默认奖项，或每行用「名字,奖项」', icon: 'none' });
      return;
    }
    this.setData({ issuing: true });
    let imageFileId = '';
    if (this.data.certImage) {
      imageFileId = await api.uploadAchievementImage(this.data.certImage);
      if (!imageFileId) {
        this.setData({ issuing: false });
        wx.showToast({ title: '奖状图片上传失败，请重试', icon: 'none' });
        return;
      }
    }
    const res = await api.issueCertificates({
      eventId: eventId.trim(),
      eventName: eventName.trim(),
      title: title.trim(),
      level,
      recipients,
      imageFileId,
    });
    this.setData({ issuing: false });
    if (!res || !res.ok) {
      wx.showModal({ title: '发布失败', content: (res && res.message) || '请稍后重试', showCancel: false });
      return;
    }
    this.setData({ issued: res.certificates || [], namesText: '', certImage: '' });
    const skipped = res.skipped || [];
    if (skipped.length) {
      wx.showModal({
        title: `已发布 ${res.certificates.length} 座奖杯`,
        content: `跳过 ${skipped.length} 人（同赛事同奖项此前已发过）：${skipped.join('、')}`,
        showCancel: false,
      });
    } else {
      wx.showToast({ title: `已发布 ${res.certificates.length} 座奖杯`, icon: 'success' });
    }
    this.loadCerts();
  },

  /** 复制本次发布结果，发给选手 */
  copyIssued() {
    const { issued, batchForm } = this.data;
    if (!issued.length) return;
    const lines = issued.map((item) => `${item.recipientName}（${item.title}） 验证码：${item.code}`);
    const text = `【${batchForm.eventName}】电子奖杯已发布 🏆 请在 HackerTrip 小程序「我的 → 黑客松旅行 → 领取奖杯」输入姓名和验证码领取官方认证：\n${lines.join('\n')}`;
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制，发给选手吧', icon: 'none' }) });
  },

  copyOneCode(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    wx.setClipboardData({ data: code, success: () => wx.showToast({ title: '验证码已复制', icon: 'none' }) });
  },

  /* ---------------- 手动验证（兜底） ---------------- */

  toggleManual() {
    this.setData({ showManual: !this.data.showManual });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onLevelChange(e) {
    const value = LEVELS[Number(e.detail.value)] || 'award';
    this.setData({ 'form.level': value, levelLabel: LEVEL_TEXT[value] });
  },

  async submit() {
    if (this.data.submitting) return;
    const auth = await api.requireAuth(this, '/pages/organizer-verify/organizer-verify', '登录并通过组织者认证后才能验证选手履历。');
    if (!auth) return;
    await this.refresh({ wait: true });
    if (!this.data.isApproved) {
      wx.showModal({
        title: '需要组织者认证',
        content: '只有已认证主办方可以给选手写入主办方验证履历。',
        showCancel: false,
      });
      return;
    }
    const form = this.data.form;
    if (!form.eventId.trim() || !form.targetUid.trim() || !form.title.trim()) {
      wx.showToast({ title: '请填写赛事、用户ID和记录标题', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const res = await api.verifyAchievement(form);
    this.setData({ submitting: false });
    if (!res || !res.ok) {
      wx.showModal({
        title: '验证失败',
        content: (res && res.message) || '请稍后重试',
        showCancel: false,
      });
      return;
    }
    wx.showModal({
      title: '已写入可信履历',
      content: `已为 ${form.targetUid} 写入「${form.title}」记录。`,
      showCancel: false,
    });
  },

  goOrganizer() {
    wx.navigateTo({ url: '/pages/organizer/organizer' });
  },
});
