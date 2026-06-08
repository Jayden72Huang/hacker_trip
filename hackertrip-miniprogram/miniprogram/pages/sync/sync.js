const api = require('../../utils/api.js');

Page({
  data: {
    code: '',
    syncing: false,
    scan: null,
    steps: [
      { n: 1, t: '电脑装好 Skill', d: '终端运行 curl -sfL hackertrip.space/install | bash' },
      { n: 2, t: '进入你的项目目录', d: '用 Claude Code / Cursor / Windsurf 打开想参赛的项目' },
      { n: 3, t: '运行 /ht-scan-project', d: 'AI 扫描代码，生成项目画像 + Top5 黑客松匹配' },
      { n: 4, t: '复制 6 位配对码', d: '扫描结束会给出配对码，输入到下方即可同步到手机' },
    ],
  },

  onShow() {
    this.setData({ scan: api.getScanResults() });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value.replace(/\s/g, '').toUpperCase() });
  },

  async pull() {
    const code = this.data.code.trim();
    // 云端模式必须输入有效配对码；本地演示模式允许空码（载入 mock）
    if (api.cloudReady() && code.length < 4) {
      wx.showToast({ title: '请输入配对码', icon: 'none' });
      return;
    }
    this.setData({ syncing: true });
    const res = await api.pullSyncByCode(code || 'DEMO');
    this.setData({ syncing: false });
    if (res && res.ok) {
      this.setData({ scan: api.getScanResults() });
      wx.showToast({ title: res.mock ? '已载入演示数据' : '同步成功', icon: 'success' });
    } else {
      wx.showToast({ title: (res && res.message) || '同步失败', icon: 'none' });
    }
  },

  demoSync() {
    this.setData({ code: '' });
    this.pull();
  },

  viewResult() {
    wx.navigateTo({ url: '/pages/result/result' });
  },
  makeCard() {
    wx.navigateTo({ url: '/pages/card/card' });
  },

  copyInstall() {
    wx.setClipboardData({
      data: 'curl -sfL hackertrip.space/install | bash',
      success: () => wx.showToast({ title: '安装命令已复制', icon: 'none' }),
    });
  },
});
