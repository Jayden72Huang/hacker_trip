#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const autoPort = Number(process.env.MINIPROGRAM_AUTO_PORT || 9450);
const automatorPath = process.env.MINIPROGRAM_AUTOMATOR
  || '/private/tmp/ht-automator/node_modules/miniprogram-automator';
const screenshotDir = path.join(root, 'screenshots', 'organizer-flow');

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function shot(miniProgram, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const file = path.join(screenshotDir, `${name}.png`);
  await miniProgram.screenshot({ path: file });
  return path.relative(root, file);
}

async function assertTexts(elements, expected, label) {
  const texts = [];
  for (const el of elements) texts.push(await el.text());
  for (const item of expected) {
    assert(texts.some((text) => String(text).includes(item)), `${label} missing text: ${item}`);
  }
  return texts;
}

async function organizerCase(miniProgram, status, statusText, statusActionText, name) {
  const page = await miniProgram.reLaunch('/pages/organizer/organizer');
  await wait(page, 900);
  await page.setData({
    status,
    statusText,
    statusActionText,
    statusHint: status === 'approved'
      ? '认证已通过，现在可以发布黑客松；提交后的赛事仍会进入内容审核。'
      : (status === 'pending'
        ? '我们会核对机构身份和活动真实性，审核通过后开放赛事发布。'
        : '填写下方申请信息，提交后进入平台审核。'),
    form: {
      orgName: '',
      role: '',
      contact: '',
      website: '',
      note: '',
    },
    drafts: [],
  });
  await wait(page, 300);
  const data = await page.data();
  assert(data.status === status, `organizer ${name} status mismatch`);
  const cards = await page.$$('.box-title');
  const titles = await assertTexts(cards, ['当前状态'], `organizer ${name}`);
  assert(!titles.some((text) => String(text).includes('生成提交配对码')), 'organizer page must not render submit pair card');
  return shot(miniProgram, name);
}

async function createCase(miniProgram, allowed, name) {
  const page = await miniProgram.reLaunch('/pages/hackathon-create/hackathon-create');
  await wait(page, 900);
  await page.setData({
    allowed,
    pairCreating: false,
    pairCode: '',
    pairUploadToken: '',
    pairStatusText: '已通过组织者认证后，可生成一次性配对码供电脑端提交赛事。',
  });
  await wait(page, 300);
  const data = await page.data();
  assert(data.allowed === allowed, `create ${name} allowed mismatch`);
  const titles = await assertTexts(await page.$$('.box-title'), [allowed ? 'CLI 提交配对码' : '需要组织者认证'], `create ${name}`);
  if (!allowed) assert(!titles.some((text) => String(text).includes('CLI 提交配对码')), 'unapproved create page must not render pair card');
  return shot(miniProgram, name);
}

async function adminNotifyCase(miniProgram) {
  const page = await miniProgram.reLaunch('/pages/admin-hackathons/admin-hackathons');
  await wait(page, 900);
  await page.setData({
    loading: false,
    isAdmin: true,
    error: '',
    activeTab: 'live',
    notifyingId: '',
    drafts: [],
    organizers: [],
    hackathons: [{
      _id: 'demo-doc',
      id: 'demo-event',
      name: 'Demo 主办方发布测试赛',
      shortName: 'Demo 测试赛',
      city: '线上',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      modeText: '线上',
      prizePool: 'Demo 奖池',
      tracksText: 'AI Agent',
      organizerName: 'HackerTrip',
      website: 'https://hackertrip.space',
      isPublished: true,
      publishedText: '已上线',
    }],
  });
  await wait(page, 300);
  const buttons = await page.$$('.small-btn');
  await assertTexts(buttons, ['下线', '通知'], 'admin live notify');
  return shot(miniProgram, 'admin-live-notify');
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

  const screenshots = {};
  try {
    screenshots.organizerNone = await organizerCase(miniProgram, 'none', '未申请', '立即申请', 'organizer-none');
    screenshots.organizerPending = await organizerCase(miniProgram, 'pending', '审核中', '查看进度', 'organizer-pending');
    screenshots.organizerApproved = await organizerCase(miniProgram, 'approved', '已认证', '发布赛事', 'organizer-approved');
    screenshots.createGated = await createCase(miniProgram, false, 'create-gated');
    screenshots.createApprovedPair = await createCase(miniProgram, true, 'create-approved-pair');
    screenshots.adminLiveNotify = await adminNotifyCase(miniProgram);
    console.log(JSON.stringify({ ok: true, screenshots }, null, 2));
  } finally {
    await miniProgram.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
