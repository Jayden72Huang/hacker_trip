import { config } from 'dotenv';
config({ path: '.env.local' });

import { buildWxPreview, ReviewCandidate, writeRuntimeArtifact } from './lib/hackathon-ops-core';
import { reviewStatuses, hackathonOpsConfig } from './lib/hackathon-ops-config';
import { dateValue, listAllRecords, sendReviewMessage, textValue } from './lib/feishu-cli';

const SEND = process.argv.includes('--send');
const batchDateArg = process.argv.find((arg, index, all) => all[index - 1] === '--date' && arg !== '--date');
const batchDate = batchDateArg || new Date().toISOString().slice(0, 10);

function rowToCandidate(fields: Record<string, unknown>): ReviewCandidate {
  const confidence = Number(fields['置信度'] || 0);
  return {
    candidateId: textValue(fields['候选ID']),
    name: textValue(fields['赛事名称']),
    shortName: textValue(fields['简称']),
    city: textValue(fields['城市']),
    country: textValue(fields['国家']),
    venue: textValue(fields['场地']),
    format: textValue(fields['形式']),
    theme: textValue(fields['主题']),
    summary: textValue(fields['简介']),
    startDate: dateValue(fields['开始日期']),
    endDate: dateValue(fields['结束日期']),
    registrationDeadline: dateValue(fields['报名截止']),
    prizePool: textValue(fields['奖金池']),
    teams: textValue(fields['参赛规模']),
    tracks: textValue(fields['赛道']).split(/\s*\/\s*/).filter(Boolean).map(title => ({ title })),
    organizers: textValue(fields['主办方']).split(/\s*\/\s*/).filter(Boolean).map(name => ({ name })),
    website: textValue(fields['官网']),
    sourceUrl: textValue(fields['来源链接']),
    platform: textValue(fields['来源平台']),
    confidence,
    confidenceLevel: confidence >= 90 ? '高' : confidence >= 75 ? '中' : '低',
    confidenceReasons: textValue(fields['置信依据']).split('；').filter(Boolean),
    missingFields: textValue(fields['缺失字段']).split('、').filter(Boolean),
    dedupeKey: textValue(fields['去重键']),
    batchDate: textValue(fields['运行批次']) || batchDate,
    reviewStatus: textValue(fields['审核状态']),
  };
}

function main() {
  const rows = listAllRecords(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.crawlerTableId);
  const candidates = rows
    .filter(record => textValue(record.fields['审核状态']) === reviewStatuses.synced)
    .filter(record => {
      const syncDate = dateValue(record.fields['同步时间']);
      return syncDate ? syncDate === batchDate : textValue(record.fields['运行批次']) === batchDate;
    })
    .map(record => rowToCandidate(record.fields));
  const preview = buildWxPreview(candidates, batchDate);
  const target = writeRuntimeArtifact(batchDate, 'wx-preview.txt', preview);
  console.log(preview);
  console.log(`\n已保存: ${target}`);
  if (SEND && candidates.length > 0) {
    sendReviewMessage(`## 微信赛事推送预览｜${batchDate}\n\n\`\`\`text\n${preview}\n\`\`\``, `hackertrip-wx-preview-${batchDate}`);
    console.log('已推送飞书群');
  }
}

try {
  main();
} catch (error) {
  console.error('生成微信预览失败:', error instanceof Error ? error.message : error);
  process.exit(1);
}
