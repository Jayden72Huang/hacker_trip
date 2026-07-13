import { config } from 'dotenv';
config({ path: '.env.local' });

import { hackathonOpsConfig, outreachStatuses, reviewStatuses, targetPlatforms } from './lib/hackathon-ops-config';
import { createField, larkDoctor, listFields, listTables } from './lib/feishu-cli';

type FieldSpec = Record<string, unknown> & { name: string };

const APPLY = process.argv.includes('--apply');

const reviewFields: FieldSpec[] = [
  { type: 'text', name: '赛事名称' },
  { type: 'text', name: '简称' },
  { type: 'text', name: '主题' },
  { type: 'text', name: '简介' },
  { type: 'text', name: '城市' },
  { type: 'text', name: '国家' },
  { type: 'text', name: '场地' },
  { type: 'select', name: '形式', multiple: false, options: [{ name: '线下' }, { name: '线上' }, { name: '混合' }] },
  { type: 'datetime', name: '开始日期', style: { format: 'yyyy-MM-dd' } },
  { type: 'datetime', name: '结束日期', style: { format: 'yyyy-MM-dd' } },
  { type: 'datetime', name: '报名截止', style: { format: 'yyyy-MM-dd' } },
  { type: 'text', name: '奖金池' },
  { type: 'text', name: '参赛规模' },
  { type: 'text', name: '赛道' },
  { type: 'text', name: '主办方' },
  { type: 'text', name: '官网', style: { type: 'url' } },
  { type: 'text', name: '来源链接', style: { type: 'url' } },
  { type: 'text', name: '来源平台' },
  { type: 'number', name: '置信度', style: { type: 'plain', precision: 0 } },
  { type: 'datetime', name: '采集时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'text', name: '候选ID', description: '每日爬虫生成的稳定候选键' },
  { type: 'select', name: '置信等级', multiple: false, options: [
    { name: '高', hue: 'Green', lightness: 'Light' },
    { name: '中', hue: 'Orange', lightness: 'Light' },
    { name: '低', hue: 'Red', lightness: 'Light' },
  ] },
  { type: 'text', name: '置信依据' },
  { type: 'text', name: '缺失字段' },
  { type: 'text', name: '去重键' },
  { type: 'text', name: '运行批次' },
  { type: 'select', name: '审核状态', multiple: false, options: Object.values(reviewStatuses).map(name => ({ name })) },
  { type: 'text', name: '审核意见' },
  { type: 'user', name: '审核人', multiple: false },
  { type: 'datetime', name: '审核时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'select', name: '上线平台', multiple: true, options: targetPlatforms.map(name => ({ name })) },
  { type: 'text', name: '赛事ID' },
  { type: 'datetime', name: '同步时间', style: { format: 'yyyy-MM-dd HH:mm' } },
];

const mainFields: FieldSpec[] = [
  { type: 'text', name: '赛事ID' },
  { type: 'text', name: '赛事名称' },
  { type: 'text', name: '简称' },
  { type: 'text', name: '主题' },
  { type: 'text', name: '简介' },
  { type: 'text', name: '城市' },
  { type: 'text', name: '国家' },
  { type: 'text', name: '场地' },
  { type: 'select', name: '形式', multiple: false, options: [{ name: '线下' }, { name: '线上' }, { name: '混合' }] },
  { type: 'datetime', name: '开始日期', style: { format: 'yyyy-MM-dd' } },
  { type: 'datetime', name: '结束日期', style: { format: 'yyyy-MM-dd' } },
  { type: 'datetime', name: '报名截止', style: { format: 'yyyy-MM-dd' } },
  { type: 'text', name: '奖金池' },
  { type: 'text', name: '参赛规模' },
  { type: 'text', name: '赛道' },
  { type: 'text', name: '技术栈' },
  { type: 'text', name: '标签' },
  { type: 'text', name: '主办方' },
  { type: 'text', name: '官网', style: { type: 'url' } },
  { type: 'text', name: '来源链接', style: { type: 'url' } },
  { type: 'text', name: '来源平台' },
  { type: 'number', name: '置信度', style: { type: 'plain', precision: 0 } },
  { type: 'checkbox', name: '已上线' },
  { type: 'select', name: '上线平台', multiple: true, options: targetPlatforms.map(name => ({ name })) },
  { type: 'text', name: '候选ID' },
  { type: 'select', name: '建联状态', multiple: false, options: Object.values(outreachStatuses).map(name => ({ name })) },
  { type: 'text', name: '联系人' },
  { type: 'text', name: '联系人职位' },
  { type: 'text', name: '联系微信' },
  { type: 'text', name: '联系邮箱', style: { type: 'email' } },
  { type: 'text', name: '联系电话', style: { type: 'phone' } },
  { type: 'text', name: '官方联系方式' },
  { type: 'text', name: '建联负责人' },
  { type: 'datetime', name: '首次联系时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'datetime', name: '最近跟进时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'text', name: '下一步' },
  { type: 'text', name: '建联备注' },
  { type: 'text', name: '建联表记录ID' },
];

const partnerFields: FieldSpec[] = [
  { type: 'text', name: '赛事ID' },
  { type: 'text', name: '赛事名称' },
  { type: 'text', name: '主办方' },
  { type: 'text', name: '联系人' },
  { type: 'text', name: '职位' },
  { type: 'text', name: '微信' },
  { type: 'text', name: '邮箱', style: { type: 'email' } },
  { type: 'text', name: '电话', style: { type: 'phone' } },
  { type: 'text', name: '官方联系方式' },
  { type: 'select', name: '建联状态', multiple: false, options: [
    { name: outreachStatuses.succeeded },
    { name: outreachStatuses.paused },
  ] },
  { type: 'text', name: '跟进负责人' },
  { type: 'datetime', name: '首次联系时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'datetime', name: '最近跟进时间', style: { format: 'yyyy-MM-dd HH:mm' } },
  { type: 'text', name: '下一步' },
  { type: 'text', name: '备注' },
  { type: 'text', name: '来源链接', style: { type: 'url' } },
  { type: 'text', name: '赛事表记录ID' },
];

function fieldName(field: Record<string, unknown>): string {
  return String(field.name || field.field_name || '');
}

function ensureFields(baseToken: string, tableId: string, label: string, specs: FieldSpec[]) {
  const existing = new Set(listFields(baseToken, tableId).map(fieldName));
  const missing = specs.filter(spec => !existing.has(spec.name));
  console.log(`\n${label}: 已有 ${existing.size} 个字段，缺少 ${missing.length} 个`);
  for (const spec of missing) {
    console.log(`  ${APPLY ? '创建' : '计划创建'}: ${spec.name}`);
    if (APPLY) createField(baseToken, tableId, spec);
  }
}

function resolvePartnerTableId(): string {
  if (hackathonOpsConfig.partnerTableId) return hackathonOpsConfig.partnerTableId;
  const tables = listTables(hackathonOpsConfig.partnerBaseToken);
  const matched = tables.find(table => /建联|合作|主办方/.test(table.tableName));
  if (matched) return matched.tableId;
  if (tables.length === 1) return tables[0].tableId;
  throw new Error(`无法唯一确定建联表，请设置 FEISHU_PARTNER_TABLE_ID。当前表：${tables.map(item => `${item.tableName}(${item.tableId})`).join(', ')}`);
}

function main() {
  console.log(`飞书闭环结构检查${APPLY ? ' [写入模式]' : ' [只读预览]'}`);
  larkDoctor();
  const partnerTableId = resolvePartnerTableId();
  ensureFields(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.crawlerTableId, '爬虫采集', reviewFields);
  ensureFields(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.eventMainTableId, '赛事总表', mainFields);
  ensureFields(hackathonOpsConfig.partnerBaseToken, partnerTableId, '主办方建联表', partnerFields);
  console.log(`\n完成。建联 table_id=${partnerTableId}`);
  if (!APPLY) console.log('确认后运行 npm run feishu:setup:apply 才会创建缺失字段。');
}

main();
