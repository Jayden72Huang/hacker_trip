import { spawnSync } from 'child_process';
import { hackathonOpsConfig } from './hackathon-ops-config';

interface LarkResult<T = unknown> {
  ok?: boolean;
  data?: T;
  error?: { message?: string; hint?: string; type?: string };
  [key: string]: unknown;
}

export interface FeishuRecord {
  recordId: string;
  fields: Record<string, unknown>;
}

function runLark<T>(args: string[]): LarkResult<T> {
  const result = spawnSync('lark-cli', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = (result.stdout || result.stderr || '').trim();
  let parsed: LarkResult<T>;
  try {
    parsed = JSON.parse(output) as LarkResult<T>;
  } catch {
    if (result.status !== 0) throw new Error(output || `lark-cli exited ${result.status}`);
    return { ok: true, data: output as T };
  }
  if (result.status !== 0 || parsed.ok === false) {
    throw new Error(parsed.error?.hint || parsed.error?.message || output);
  }
  return parsed;
}

function identityArgs(): string[] {
  return ['--as', hackathonOpsConfig.feishuIdentity];
}

export function larkDoctor(): void {
  runLark(['doctor', '--offline']);
}

export function listTables(baseToken: string): { tableId: string; tableName: string }[] {
  const result = runLark<Record<string, unknown>>([
    'base', '+table-list', '--base-token', baseToken, '--limit', '100', ...identityArgs(),
  ]);
  const data = result.data || {};
  const items = (data.items || data.tables || []) as Record<string, unknown>[];
  return items.map(item => ({
    tableId: String(item.table_id || item.id || ''),
    tableName: String(item.table_name || item.name || ''),
  })).filter(item => item.tableId);
}

export function listFields(baseToken: string, tableId: string): Record<string, unknown>[] {
  const result = runLark<Record<string, unknown>>([
    'base', '+field-list', '--base-token', baseToken, '--table-id', tableId,
    '--offset', '0', '--limit', '200', ...identityArgs(),
  ]);
  const data = result.data || {};
  return (data.items || data.fields || []) as Record<string, unknown>[];
}

function recordsFromData(data: Record<string, unknown>): FeishuRecord[] {
  const fields = (data.fields || []) as string[];
  const rows = (data.data || []) as unknown[][];
  const ids = (data.record_id_list || []) as string[];
  if (fields.length && Array.isArray(rows)) {
    return rows.map((row, rowIndex) => ({
      recordId: ids[rowIndex] || '',
      fields: Object.fromEntries(fields.map((field, index) => [field, row[index] ?? null])),
    }));
  }
  const items = (data.items || data.records || []) as Record<string, unknown>[];
  return items.map(item => ({
    recordId: String(item.record_id || item.id || ''),
    fields: (item.fields || {}) as Record<string, unknown>,
  }));
}

export function listAllRecords(baseToken: string, tableId: string, fieldNames: string[] = []): FeishuRecord[] {
  const all: FeishuRecord[] = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const args = [
      'base', '+record-list', '--base-token', baseToken, '--table-id', tableId,
      '--offset', String(offset), '--limit', String(limit), '--format', 'json', ...identityArgs(),
    ];
    for (const fieldName of fieldNames) args.push('--field-id', fieldName);
    const result = runLark<Record<string, unknown>>(args);
    const data = result.data || {};
    const page = recordsFromData(data);
    all.push(...page);
    const total = Number(data.total ?? data.count ?? all.length);
    if (page.length < limit || all.length >= total) break;
    offset += page.length;
  }
  return all;
}

export function createField(baseToken: string, tableId: string, field: Record<string, unknown>, dryRun = false) {
  return runLark([
    'base', '+field-create', '--base-token', baseToken, '--table-id', tableId,
    '--json', JSON.stringify(field), ...identityArgs(), ...(dryRun ? ['--dry-run'] : []),
  ]);
}

export function batchCreateRecords(baseToken: string, tableId: string, fields: string[], rows: unknown[][], dryRun = false) {
  if (rows.length === 0) return { ok: true };
  return runLark<Record<string, unknown>>([
    'base', '+record-batch-create', '--base-token', baseToken, '--table-id', tableId,
    '--json', JSON.stringify({ fields, rows }), ...identityArgs(), ...(dryRun ? ['--dry-run'] : []),
  ]);
}

export function upsertRecord(baseToken: string, tableId: string, fields: Record<string, unknown>, recordId?: string, dryRun = false) {
  return runLark<Record<string, unknown>>([
    'base', '+record-upsert', '--base-token', baseToken, '--table-id', tableId,
    '--json', JSON.stringify(fields), ...(recordId ? ['--record-id', recordId] : []),
    ...identityArgs(), ...(dryRun ? ['--dry-run'] : []),
  ]);
}

export function sendReviewMessage(markdown: string, idempotencyKey: string, dryRun = false) {
  if (!hackathonOpsConfig.reviewChatId) throw new Error('未配置 FEISHU_REVIEW_CHAT_ID');
  return runLark<Record<string, unknown>>([
    'im', '+messages-send', '--chat-id', hackathonOpsConfig.reviewChatId,
    '--markdown', markdown, '--idempotency-key', idempotencyKey,
    ...identityArgs(), ...(dryRun ? ['--dry-run'] : []),
  ]);
}

export function textValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    const markdownLink = value.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
    return markdownLink ? markdownLink[1] : value;
  }
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item) {
        const obj = item as Record<string, unknown>;
        return String(obj.text || obj.name || obj.value || '');
      }
      return String(item);
    }).filter(Boolean).join(' / ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return String(obj.text || obj.name || obj.value || '');
  }
  return String(value);
}

export function multiValue(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean);
  return textValue(value).split(/\s*[\/,]\s*/).filter(Boolean);
}

export function dateValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  return textValue(value).slice(0, 10);
}
