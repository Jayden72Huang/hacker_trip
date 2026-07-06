#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const autoPort = Number(process.env.MINIPROGRAM_AUTO_PORT || 9468);
const automatorPath = process.env.MINIPROGRAM_AUTOMATOR
  || '/private/tmp/ht-automator/node_modules/miniprogram-automator';
const screenshotDir = path.join(root, 'screenshots');

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

async function main() {
  const automator = loadAutomator();
  const miniProgram = await automator.launch({
    cliPath,
    projectPath: root,
    port: autoPort,
    trustProject: true,
    timeout: 60000,
  });

  try {
    const page = await miniProgram.reLaunch('/pages/identity/identity');
    await page.waitFor(1500);
    await page.waitFor('.guide-step');

    const steps = await page.$$('.guide-step');
    assert(steps.length === 3, `expected 3 guide steps, got ${steps.length}`);

    const result = [];
    for (const step of steps) {
      const text = await step.text();
      const offset = await step.offset();
      const size = await step.size();
      result.push({ text, offset, size });
    }

    assert(result[0].text.includes('编辑资料'), 'step 1 should be 编辑资料');
    assert(result[1].text.includes('生成预览'), 'step 2 should be 生成预览');
    assert(result[2].text.includes('保存转发'), 'step 3 should be 保存转发');
    assert(result[0].offset.top < result[1].offset.top, 'step 2 should be below step 1');
    assert(result[1].offset.top < result[2].offset.top, 'step 3 should be below step 2');
    assert(Math.abs(result[0].offset.left - result[1].offset.left) <= 4, 'step 1 and 2 should align left');
    assert(Math.abs(result[1].offset.left - result[2].offset.left) <= 4, 'step 2 and 3 should align left');

    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'identity-step-layout.png');
    await miniProgram.screenshot({ path: screenshotPath });

    console.log(JSON.stringify({
      ok: true,
      screenshot: path.relative(root, screenshotPath),
      steps: result,
    }, null, 2));
  } finally {
    await miniProgram.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
