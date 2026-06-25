const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
const env = require('../../env.js');

const hasSyncUrl = !!(env.syncUrl && env.syncUrl.trim());

function buildCommand(code, uploadToken) {
  return [
    `HACKERTRIP_SYNC_URL=${env.syncUrl}`,
    `HACKERTRIP_SYNC_TOKEN=${uploadToken}`,
    'hackertrip',
    '--path /你的项目',
    '--sync',
    `--sync-code ${code}`,
  ].join(' ');
}

Page({
  data: {
    title: 'Skills 同步',
    aiBanner: false,
    aiIntentText: 'skills.sync',
    code: '',
    uploadToken: '',
    syncing: false,
    creating: false,
    synced: false,
    commandReady: false,
    syncEndpointReady: hasSyncUrl,
    statusText: hasSyncUrl ? '先生成一次性同步命令，或输入已有 6 位配对码' : '同步入口未配置，暂时只能拉取已有配对码',
    desktopCommand: hasSyncUrl ? '点击生成后显示桌面端命令' : '需要先配置 pairSync HTTP 入口',
    result: null,
    resultSkills: [],
    steps: [
      { title: '小程序生成命令', desc: '登录后生成一次性配对码和上传 token，只绑定当前账号。' },
      { title: '桌面端扫描项目', desc: 'HackerTrip CLI 读取技术栈、项目简介和可公开的作品信息。' },
      { title: '小程序拉取结果', desc: '同步后可生成匹配结果、身份卡和公开主页。' },
    ],
  },

  onLoad(options) {
    const ai = parseAIEntry(options);
    this.setData({
      aiBanner: ai.fromAI,
      aiIntentText: ai.intent || 'skills.sync',
      code: options.pairCode || options.code || '',
    });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value.replace(/\D/g, '').slice(0, 6) });
  },

  async createPair() {
    if (this.data.creating) return;
    if (!this.data.syncEndpointReady) {
      wx.showModal({
        title: '同步入口未配置',
        content: '需要先为 pairSync 配置 HTTP 访问入口，并写入 env.js 的 syncUrl，才能生成桌面端命令。',
        showCancel: false,
      });
      return;
    }
    const auth = await api.requireAuth(this, '/pages/sync/sync', '登录后才能生成一次性同步命令。');
    if (!auth) return;
    this.setData({ creating: true, statusText: '正在生成一次性配对码...' });
    const res = await api.createSyncPair();
    if (res && res.ok && res.code && res.uploadToken) {
      this.setData({
        code: res.code,
        uploadToken: res.uploadToken,
        commandReady: true,
        desktopCommand: buildCommand(res.code, res.uploadToken),
        statusText: '已生成命令：在电脑端执行后回到这里同步',
      });
      wx.showToast({ title: '配对码已生成', icon: 'success' });
    } else {
      this.setData({
        commandReady: false,
        statusText: (res && res.message) || '配对码生成失败，请重试',
      });
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
    this.setData({ creating: false });
  },

  copyCommand() {
    if (!this.data.commandReady) {
      wx.showToast({ title: '请先生成命令', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.desktopCommand,
      success: () => wx.showToast({ title: '命令已复制', icon: 'success' }),
    });
  },

  async syncNow() {
    if (this.data.syncing) return;
    const auth = await api.requireAuth(this, '/pages/sync/sync', '登录后才能把桌面端扫描结果绑定到你的 HackerTrip 账号。');
    if (!auth) return;
    if (this.data.code.length !== 6) {
      wx.showToast({ title: '请输入 6 位配对码', icon: 'none' });
      return;
    }
    this.setData({ syncing: true, statusText: '正在同步 Skills 数据...' });
    const res = await api.pullSyncByCode(this.data.code);
    if (res && res.ok) {
      const scan = api.getScanResults();
      this.setData({
        synced: true,
        result: scan,
        resultSkills: ((scan && scan.project && scan.project.techStack) || (scan && scan.identity && scan.identity.techStack) || []).slice(0, 8),
        statusText: '同步成功，已绑定到当前微信账号',
      });
      wx.showToast({ title: '同步成功', icon: 'success' });
    } else {
      this.setData({ synced: false, result: null, resultSkills: [], statusText: (res && res.message) || '同步失败，请稍后重试' });
      wx.showToast({ title: '同步失败', icon: 'none' });
    }
    this.setData({ syncing: false });
  },

  onAuthLogin() {
    // requireAuth resolves after the modal login succeeds; syncNow will continue there.
  },

  goMatch() {
    wx.navigateTo({ url: '/pages/match/match' });
  },
});
