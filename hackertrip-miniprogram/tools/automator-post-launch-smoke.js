#!/usr/bin/env node

const path = require('path');

const root = path.resolve(__dirname, '..');
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const autoPort = Number(process.env.MINIPROGRAM_AUTO_PORT || 9420);
const automatorPath = process.env.MINIPROGRAM_AUTOMATOR
  || '/private/tmp/ht-automator/node_modules/miniprogram-automator';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadAutomator() {
  try {
    return require(automatorPath);
  } catch (error) {
    throw new Error(`miniprogram-automator not found at ${automatorPath}`);
  }
}

async function wait(page, ms) {
  await page.waitFor(ms);
}

async function verifyProfile(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/profile/profile');
  await wait(page, 900);
  const data = await page.data();
  assert(data.title === '我的', 'profile page title should be 我的');
  assert(typeof data.isLoggedIn === 'boolean', 'profile page must expose login state');
  assert(data.authAccount && data.authAccount.copy, 'profile page must expose auth account copy');
  assert(Array.isArray(data.tools), 'profile page must expose tools list');
  assert(data.tools.some((item) => item.title === '我的身份卡'), 'profile tools must include identity card');
  assert(data.tools.some((item) => item.title === 'Skills 同步'), 'profile tools must include Skills sync');
  const loginButton = await page.$('.login-btn');
  assert(loginButton, 'profile page must render login button');
  return { isLoggedIn: data.isLoggedIn, loginText: await loginButton.text() };
}

async function verifySchedule(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/schedule/schedule');
  await wait(page, 900);
  const data = await page.data();
  assert(data.title === '赛程', 'schedule page title should be 赛程');
  assert(Array.isArray(data.myEvents), 'schedule page must expose joined events');
  assert(Array.isArray(data.bookmarkedEvents), 'schedule page must expose bookmarked events');
  const sections = await page.$$('.section-title');
  const texts = [];
  for (const section of sections) texts.push(await section.text());
  assert(texts.includes('已加入赛程'), 'schedule page must render joined-event section');
  assert(texts.includes('已收藏赛事'), 'schedule page must render bookmarked-event section');
  return { sections: texts };
}

async function verifyDetail(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/detail/detail?id=ht-06');
  await wait(page, 1000);
  const data = await page.data();
  assert(data.title === '黑客松详情', 'detail page title should be 黑客松详情');
  assert(data.item && data.item.id, 'detail page must load hackathon item');
  assert(Array.isArray(data.metaRows) && data.metaRows.length >= 6, 'detail page must expose structured meta rows');
  const authModal = await page.$('auth-modal');
  assert(authModal, 'detail page must mount auth modal');
  return { id: data.item.id, metaCount: data.metaRows.length };
}

async function verifyIdentity(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/identity/identity');
  await wait(page, 1100);
  const data = await page.data();
  assert(data.title === '身份卡', 'identity page title should be 身份卡');
  assert(data.configPanelOpen === false, 'identity config panel should be collapsed by default');
  const shareQuery = await page.callMethod('buildShareQuery');
  assert(String(shareQuery || '').includes('role='), 'identity page must prepare share query');
  const sharePayload = await page.callMethod('onShareAppMessage');
  assert(sharePayload && String(sharePayload.path || '').includes('/pages/share/share'), 'identity page must prepare share path');
  const authModal = await page.$('auth-modal');
  assert(authModal, 'identity page must mount auth modal');
  const steps = await page.$$('.flow-title');
  const texts = [];
  for (const step of steps) texts.push(await step.text());
  assert(texts.includes('编辑资料'), 'identity page must show edit step');
  assert(texts.includes('生成预览'), 'identity page must show generate step');
  assert(texts.includes('保存转发'), 'identity page must show save/share step');
  return { sharePath: sharePayload.path, steps: texts };
}

async function verifySync(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/sync/sync');
  await wait(page, 900);
  const data = await page.data();
  assert(data.title === 'Skills 同步', 'sync page title should be Skills 同步');
  assert(data.syncEndpointReady === true, 'sync page should have pairSync HTTP endpoint configured');
  assert(String(data.desktopCommand || '').includes('点击生成后显示桌面端命令'), 'sync page should wait for one-time command generation');
  const authModal = await page.$('auth-modal');
  assert(authModal, 'sync page must mount auth modal');
  return { syncEndpointReady: data.syncEndpointReady, statusText: data.statusText };
}

async function verifyAgent(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/agent/agent');
  await wait(page, 900);
  const data = await page.data();
  assert(data.title === 'Agent 配置', 'agent page title should be Agent 配置');
  assert(Array.isArray(data.sourceSteps) && data.sourceSteps.length >= 3, 'agent page must expose data source status');
  assert(Array.isArray(data.rows) && data.rows.length >= 4, 'agent page must expose configurable context switches');
  const authModal = await page.$('auth-modal');
  assert(authModal, 'agent page must mount auth modal');
  return { sources: data.sourceSteps.map((item) => item.title), rows: data.rows.map((item) => item.key) };
}

async function main() {
  const automator = loadAutomator();
  const miniProgram = await automator.launch({
    cliPath,
    projectPath: root,
    port: autoPort,
    trustProject: true,
    timeout: 60000,
  });

  const result = {};
  try {
    result.profile = await verifyProfile(miniProgram);
    result.schedule = await verifySchedule(miniProgram);
    result.detail = await verifyDetail(miniProgram);
    result.identity = await verifyIdentity(miniProgram);
    result.sync = await verifySync(miniProgram);
    result.agent = await verifyAgent(miniProgram);
    console.log(JSON.stringify({ ok: true, result }, null, 2));
  } finally {
    await miniProgram.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
