import { config } from 'dotenv';
config({ path: '.env.local' });

import { hackathonOpsConfig, outreachStatuses } from './lib/hackathon-ops-config';
import { dateValue, listAllRecords, listTables, textValue, upsertRecord } from './lib/feishu-cli';

const DRY_RUN = process.argv.includes('--dry-run');

function resolvePartnerTableId(): string {
  if (hackathonOpsConfig.partnerTableId) return hackathonOpsConfig.partnerTableId;
  const tables = listTables(hackathonOpsConfig.partnerBaseToken);
  const matched = tables.find(table => /建联|合作|主办方/.test(table.tableName));
  if (matched) return matched.tableId;
  if (tables.length === 1) return tables[0].tableId;
  throw new Error('无法唯一确定建联表，请设置 FEISHU_PARTNER_TABLE_ID');
}

function readRecordId(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const data = (result as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return '';
  const record = (data as { record?: unknown }).record;
  if (!record || typeof record !== 'object') return '';
  const value = record as { record_id?: unknown; id?: unknown };
  return String(value.record_id || value.id || '');
}

function main() {
  const partnerTableId = resolvePartnerTableId();
  const eventRows = listAllRecords(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.eventMainTableId);
  const partnerRows = listAllRecords(hackathonOpsConfig.partnerBaseToken, partnerTableId);
  const existingByEventId = new Map(partnerRows.map(record => [textValue(record.fields['赛事ID']), record]));
  const succeeded = eventRows.filter(record => textValue(record.fields['建联状态']) === outreachStatuses.succeeded);

  console.log(`建联成功待同步 ${succeeded.length} 条${DRY_RUN ? ' [dry-run]' : ''}`);
  let synced = 0;
  for (const event of succeeded) {
    const fields = event.fields;
    const eventId = textValue(fields['赛事ID']);
    const name = textValue(fields['赛事名称']);
    const organizer = textValue(fields['主办方']);
    const hasContact = ['联系人', '联系微信', '联系邮箱', '联系电话', '官方联系方式']
      .some(field => Boolean(textValue(fields[field])));
    if (!eventId || !organizer || !hasContact) {
      console.warn(`  ⛔ 缺少赛事ID、主办方或联系方式: ${name || event.recordId}`);
      continue;
    }

    const existing = existingByEventId.get(eventId);
    const partnerFields = {
      '赛事ID': eventId,
      '赛事名称': name,
      '主办方': organizer,
      '联系人': textValue(fields['联系人']),
      '职位': textValue(fields['联系人职位']),
      '微信': textValue(fields['联系微信']),
      '邮箱': textValue(fields['联系邮箱']),
      '电话': textValue(fields['联系电话']),
      '官方联系方式': textValue(fields['官方联系方式']),
      '建联状态': outreachStatuses.succeeded,
      '跟进负责人': textValue(fields['建联负责人']),
      '首次联系时间': dateValue(fields['首次联系时间']) || null,
      '最近跟进时间': dateValue(fields['最近跟进时间']) || null,
      '下一步': textValue(fields['下一步']),
      '备注': textValue(fields['建联备注']),
      '来源链接': textValue(fields['来源链接']) || textValue(fields['官网']),
      '赛事表记录ID': event.recordId,
    };
    console.log(`  ${existing ? '更新' : '新增'}: ${eventId} ${organizer}`);
    const result = upsertRecord(
      hackathonOpsConfig.partnerBaseToken,
      partnerTableId,
      partnerFields,
      existing?.recordId,
      DRY_RUN,
    );
    const partnerRecordId = existing?.recordId || readRecordId(result);
    upsertRecord(
      hackathonOpsConfig.eventBaseToken,
      hackathonOpsConfig.eventMainTableId,
      {
        '建联状态': outreachStatuses.synced,
        '建联表记录ID': partnerRecordId,
      },
      event.recordId,
      DRY_RUN,
    );
    synced++;
  }
  console.log(`建联同步完成：${synced} 条`);
}

try {
  main();
} catch (error) {
  console.error('建联同步失败:', error instanceof Error ? error.message : error);
  process.exit(1);
}
