const api = require('../../utils/api.js');
const { parseAIEntry } = require('../../utils/ai.js');
const env = require('../../env.js');

const hasSyncUrl = !!(env.syncUrl && env.syncUrl.trim());

function buildCommand(code, uploadToken) {
  return [
    `HACKERTRIP_SYNC_URL=${env.syncUrl}`,
    `HACKERTRIP_SYNC_TOKEN=${uploadToken}`,
    'npx hackertrip match',
    '--path .',
    '--sync',
    `--sync-code ${code}`,
  ].join(' ');
}

function buildAgentPrompt(code, uploadToken) {
  if (!code || !uploadToken || !env.syncUrl) {
    return '先点击“生成同步码”，再复制给电脑端 Agent。';
  }
  return [
    '请在当前打开的项目根目录执行 HackerTrip Skills 同步，把项目画像同步到我的 HackerTrip 小程序账号。',
    '',
    '操作要求：',
    '1. 确认当前目录就是要扫描的项目根目录。',
    '2. 执行下面的命令；如果没有安装 hackertrip，请用 npx 自动拉起。',
    '3. 只同步项目画像、技术栈、作品摘要和赛事匹配结果，不上传源码文件。',
    '',
    buildCommand(code, uploadToken),
    '',
    '执行成功后告诉我：已经推送完成，我再回小程序点击“拉取结果”。',
  ].join('\n');
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
    statusText: hasSyncUrl ? '先生成同步码，再让 Agent 或 CLI 推送结果' : '同步入口未配置，暂时只能拉取已有配对码',
    desktopCommand: hasSyncUrl ? '生成同步码后显示 CLI 命令' : '需要先配置 pairSync HTTP 入口',
    agentPrompt: '先点击“生成同步码”，再复制给电脑端 Agent。',
    result: null,
    resultSkills: [],
    tutorialOpen: false,
  },

  toggleTutorial() {
    this.setData({ tutorialOpen: !this.data.tutorialOpen });
  },

  copyTutorialCmd(e) {
    const cmd = e.currentTarget.dataset.cmd;
    if (!cmd) return;
    wx.setClipboardData({
      data: cmd,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
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
        agentPrompt: buildAgentPrompt(res.code, res.uploadToken),
        statusText: '已生成同步码：让 Agent 或 CLI 执行后，回到这里拉取结果',
      });
      wx.showToast({ title: '同步码已生成', icon: 'success' });
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

  copyAgentPrompt() {
    if (!this.data.commandReady) {
      wx.showToast({ title: '请先生成同步码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.agentPrompt,
      success: () => wx.showToast({ title: 'Agent Prompt 已复制', icon: 'success' }),
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
