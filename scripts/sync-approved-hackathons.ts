import { config } from 'dotenv';
config({ path: '.env.local' });

import { spawnSync } from 'child_process';
import { neon } from '@neondatabase/serverless';
import { hackathonOpsConfig, reviewStatuses, targetPlatforms } from './lib/hackathon-ops-config';
import { dateValue, listAllRecords, multiValue, textValue, upsertRecord } from './lib/feishu-cli';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_PLATFORM_SYNC = process.argv.includes('--skip-platform-sync');

function formatDateTime(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function eventIdFromCandidate(candidateId: string): string {
  return `ht-${candidateId.replace(/^HK-/, '').toLowerCase()}`;
}

function readRecordId(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const data = (result as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return '';
  const record = (data as { record?: unknown }).record;
  if (!record || typeof record !== 'object') return '';
  return String((record as { record_id?: unknown; id?: unknown }).record_id || (record as { id?: unknown }).id || '');
}

function candidateToMainFields(fields: Record<string, unknown>, eventId: string) {
  const platforms = multiValue(fields['上线平台']);
  return {
    '赛事ID': eventId,
    '候选ID': textValue(fields['候选ID']),
    '赛事名称': textValue(fields['赛事名称']),
    '简称': textValue(fields['简称']),
    '主题': textValue(fields['主题']),
    '简介': textValue(fields['简介']),
    '城市': textValue(fields['城市']),
    '国家': textValue(fields['国家']) || '中国',
    '场地': textValue(fields['场地']),
    '形式': textValue(fields['形式']) || '线下',
    '开始日期': dateValue(fields['开始日期']) ? `${dateValue(fields['开始日期'])} 00:00:00` : null,
    '结束日期': dateValue(fields['结束日期']) ? `${dateValue(fields['结束日期'])} 00:00:00` : null,
    '报名截止': dateValue(fields['报名截止']) ? `${dateValue(fields['报名截止'])} 00:00:00` : null,
    '奖金池': textValue(fields['奖金池']),
    '参赛规模': textValue(fields['参赛规模']),
    '赛道': textValue(fields['赛道']),
    '主办方': textValue(fields['主办方']),
    '官网': textValue(fields['官网']) || textValue(fields['来源链接']),
    '来源链接': textValue(fields['来源链接']),
    '来源平台': textValue(fields['来源平台']),
    '置信度': Number(fields['置信度'] || 0),
    '已上线': true,
    '上线平台': platforms.length ? platforms : [...targetPlatforms],
    '建联状态': '待建联',
  };
}

async function markNeonDraft(candidateId: string, published: boolean) {
  if (!process.env.DATABASE_URL || DRY_RUN) return;
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    UPDATE draft_hackathon
    SET status = ${published ? 'published' : 'approved'},
        reviewed_at = COALESCE(reviewed_at, NOW()),
        published_at = CASE WHEN ${published} THEN COALESCE(published_at, NOW()) ELSE published_at END
    WHERE raw_data->>'candidateId' = ${candidateId}
  `;
}

async function main() {
  console.log(`审核通过赛事同步${DRY_RUN ? ' [dry-run]' : ''}`);
  const candidates = listAllRecords(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.crawlerTableId);
  const mainRows = listAllRecords(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.eventMainTableId);
  const approved = candidates.filter(record => textValue(record.fields['审核状态']) === reviewStatuses.approved);
  const byCandidateId = new Map(mainRows.map(record => [textValue(record.fields['候选ID']), record]));
  const byEventId = new Map(mainRows.map(record => [textValue(record.fields['赛事ID']), record]));

  console.log(`待同步 ${approved.length} 条`);
  let created = 0;
  let updated = 0;
  let blocked = 0;

  for (const candidate of approved) {
    const candidateId = textValue(candidate.fields['候选ID']);
    const name = textValue(candidate.fields['赛事名称']);
    const startDate = dateValue(candidate.fields['开始日期']);
    const endDate = dateValue(candidate.fields['结束日期']);
    if (!candidateId || !name || !startDate || !endDate) {
      blocked++;
      console.warn(`  ⛔ 缺少候选ID/赛事名称/起止日期，保留待处理: ${name || candidate.recordId}`);
      continue;
    }

    const eventId = textValue(candidate.fields['赛事ID']) || eventIdFromCandidate(candidateId);
    const existing = byCandidateId.get(candidateId) || byEventId.get(eventId);
    const mainFields = candidateToMainFields(candidate.fields, eventId);
    console.log(`  ${existing ? '更新' : '新增'}: ${eventId} ${name}`);
    const result = upsertRecord(
      hackathonOpsConfig.eventBaseToken,
      hackathonOpsConfig.eventMainTableId,
      mainFields,
      existing?.recordId,
      DRY_RUN,
    );
    const mainRecordId = existing?.recordId || readRecordId(result);

    upsertRecord(
      hackathonOpsConfig.eventBaseToken,
      hackathonOpsConfig.crawlerTableId,
      {
        '审核状态': reviewStatuses.synced,
        '赛事ID': eventId,
        '同步时间': formatDateTime(),
      },
      candidate.recordId,
      DRY_RUN,
    );
    await markNeonDraft(candidateId, false);
    if (existing) updated++; else created++;
    if (!DRY_RUN && mainRecordId) byCandidateId.set(candidateId, { recordId: mainRecordId, fields: mainFields });
  }

  if (!DRY_RUN && approved.length > blocked && !SKIP_PLATFORM_SYNC) {
    const result = spawnSync('npx', ['tsx', 'scripts/sync-from-feishu.ts'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (result.status !== 0) throw new Error(`双端同步失败，exit=${result.status}`);
    for (const candidate of approved) {
      const candidateId = textValue(candidate.fields['候选ID']);
      if (candidateId) await markNeonDraft(candidateId, true);
    }
  }

  console.log(`完成：新增 ${created}，更新 ${updated}，阻塞 ${blocked}`);
}

main().catch(error => {
  console.error('同步失败:', error instanceof Error ? error.message : error);
  process.exit(1);
});
