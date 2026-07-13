import { spawnSync } from 'child_process';

interface Step {
  label: string;
  script: string;
  args?: string[];
  optional?: boolean;
}

const steps: Step[] = [
  { label: '同步已审核赛事', script: 'scripts/sync-approved-hackathons.ts' },
  { label: '同步建联成功主办方', script: 'scripts/sync-organizer-contacts.ts', optional: true },
  { label: '生成并推送微信预览', script: 'scripts/generate-wx-daily-preview.ts', args: ['--send'], optional: true },
  { label: '爬取今日新赛事并推送审核群', script: 'scripts/daily-crawl.ts' },
];

let failed = false;
console.log(`HackerTrip 每日赛事闭环启动 ${new Date().toISOString()}`);
for (const step of steps) {
  console.log(`\n▶ ${step.label}`);
  const result = spawnSync('npx', ['tsx', step.script, ...(step.args || [])], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`✗ ${step.label}失败，exit=${result.status}`);
    if (!step.optional) failed = true;
  }
}

if (failed) process.exit(1);
console.log('\nHackerTrip 每日赛事闭环完成');
