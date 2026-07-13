import { FeishuAgentClient, readableCell, type FeishuBaseRecord } from './client';
import type { FeishuAgentConfig } from './config';

type IntentType =
  | 'query_event'
  | 'query_partner'
  | 'query_pending'
  | 'overview'
  | 'propose_event_update'
  | 'propose_partner_update'
  | 'propose_partner_create'
  | 'help';

interface AgentIntent {
  type: IntentType;
  query?: string;
  target?: string;
  fields?: Record<string, string>;
}

interface ConfirmedCommand {
  action: 'update_event' | 'update_partner' | 'create_partner';
  target: string;
  fields: Record<string, string>;
}

interface FieldDefinition {
  type: 'text' | 'datetime' | 'checkbox' | 'select' | 'multi_select';
  options?: readonly string[];
}

const eventFields: Record<string, FieldDefinition> = {
  赛事名称: { type: 'text' },
  主办方: { type: 'text' },
  官网: { type: 'text' },
  来源链接: { type: 'text' },
  开始日期: { type: 'datetime' },
  结束日期: { type: 'datetime' },
  报名截止: { type: 'datetime' },
  城市: { type: 'text' },
  形式: { type: 'select', options: ['线下', '线上', '混合'] },
  简介: { type: 'text' },
  主题: { type: 'text' },
  奖金池: { type: 'text' },
  已上线: { type: 'checkbox' },
  上线平台: { type: 'multi_select', options: ['网站', '小程序'] },
  建联状态: { type: 'select', options: ['待建联', '已联系', '已回复', '建联成功', '暂不合作', '无法联系', '已同步建联表'] },
  建联负责人: { type: 'text' },
  联系人: { type: 'text' },
  联系人职位: { type: 'text' },
  联系微信: { type: 'text' },
  联系电话: { type: 'text' },
  联系邮箱: { type: 'text' },
  官方联系方式: { type: 'text' },
  首次联系时间: { type: 'datetime' },
  最近跟进时间: { type: 'datetime' },
  建联备注: { type: 'text' },
  下一步: { type: 'text' },
};

const partnerFields: Record<string, FieldDefinition> = {
  主办方: { type: 'text' },
  主办方名字: { type: 'text' },
  主办方主体: { type: 'text' },
  主办方类型: { type: 'multi_select', options: ['企业', '高校', '政府机构', '社区/开发者组织', '媒体', '投资机构'] },
  举办赛事类型: { type: 'multi_select', options: ['AI/大模型', 'Web3/区块链', '硬件/机器人', '游戏', '综合创新', '行业垂直', '黑客松'] },
  级别: { type: 'select', options: ['国际级', '国家级', '省市级', '高校级', '社区级'] },
  建联状态: { type: 'select', options: ['建联成功', '暂不合作'] },
  跟进负责人: { type: 'text' },
  联系人: { type: 'text' },
  职位: { type: 'text' },
  微信: { type: 'text' },
  电话: { type: 'text' },
  邮箱: { type: 'text' },
  官方联系方式: { type: 'text' },
  首次联系时间: { type: 'datetime' },
  最近跟进时间: { type: 'datetime' },
  首次合作时间: { type: 'datetime' },
  下一步: { type: 'text' },
  备注: { type: 'text' },
  合作项目: { type: 'text' },
  赛事名称: { type: 'text' },
  赛事ID: { type: 'text' },
  来源链接: { type: 'text' },
};

const helpText = [
  '我是 HackerTrip 赛事助手，负责维护赛事与合作方数据。',
  '',
  '可以直接问：',
  '• 赛事 AdventureX',
  '• 合作方 SHE NICEST',
  '• 待审核',
  '• 数据概览',
  '• “我们已经联系了 XX，负责人是 Mandy，下一步约电话”',
  '',
  '查询会立即返回；修改数据时我会先生成预览，只有回复“确认更新…”才会写入飞书。',
].join('\n');

function safeValue(value: string): string {
  return value.replace(/[｜|\n\r]/g, '／').trim();
}

function splitAssignments(parts: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const part of parts) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key && value) fields[key] = value;
  }
  return fields;
}

export function parseConfirmedCommand(text: string): ConfirmedCommand | null {
  const normalized = text.trim();
  const matched = normalized.match(/^确认(更新赛事|更新合作方|新增合作方)\s+([\s\S]+)$/);
  if (!matched) return null;

  const verb = matched[1];
  const parts = matched[2].split(/[｜|\n]/).map(part => part.trim()).filter(Boolean);
  if (verb === '新增合作方') {
    return { action: 'create_partner', target: '', fields: splitAssignments(parts) };
  }

  const [target = '', ...assignmentParts] = parts;
  return {
    action: verb === '更新赛事' ? 'update_event' : 'update_partner',
    target,
    fields: splitAssignments(assignmentParts),
  };
}

export function buildConfirmationCommand(intent: AgentIntent): string {
  const fields = Object.entries(intent.fields || {})
    .map(([key, value]) => `${key}=${safeValue(value)}`)
    .join('｜');
  if (intent.type === 'propose_partner_create') return `确认新增合作方 ${fields}`;
  if (intent.type === 'propose_partner_update') return `确认更新合作方 ${safeValue(intent.target || '')}｜${fields}`;
  return `确认更新赛事 ${safeValue(intent.target || '')}｜${fields}`;
}

export function normalizeIncomingText(text: string, mentionKeys: string[] = []): string {
  let normalized = text;
  for (const key of mentionKeys) normalized = normalized.replaceAll(key, '');
  return normalized
    .replace(/^\s*@?HackerTrip\s*(赛事助手|Agent)?[：:\s]*/i, '')
    .replace(/^\s*(赛事助手|Agent)[：:\s]*/i, '')
    .trim();
}

function directIntent(text: string): AgentIntent | null {
  if (/^(帮助|help|怎么用|使用说明)$/i.test(text)) return { type: 'help' };
  if (/^(待审核|审核队列|待审赛事)$/.test(text)) return { type: 'query_pending' };
  if (/^(数据概览|概览|统计)$/.test(text)) return { type: 'overview' };
  const event = text.match(/^赛事[：:\s]+(.+)$/);
  if (event) return { type: 'query_event', query: event[1].trim() };
  const partner = text.match(/^(合作方|主办方)[：:\s]+(.+)$/);
  if (partner) return { type: 'query_partner', query: partner[2].trim() };
  return null;
}

function recordText(record: FeishuBaseRecord, fields: string[]): string {
  return fields.map(field => readableCell(record.fields[field])).join(' ').toLowerCase();
}

function filterRecords(records: FeishuBaseRecord[], query: string, fields: string[]): FeishuBaseRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return records;
  return records.filter(record => recordText(record, fields).includes(needle));
}

function findUniqueRecord(records: FeishuBaseRecord[], target: string, identityFields: string[]): FeishuBaseRecord {
  const needle = target.trim().toLowerCase();
  const exact = records.filter(record => identityFields.some(field => readableCell(record.fields[field]).toLowerCase() === needle));
  if (exact.length === 1) return exact[0];
  const partial = filterRecords(records, target, identityFields);
  if (partial.length === 1) return partial[0];
  if (partial.length === 0) throw new Error(`没有找到“${target}”对应的记录。`);
  const names = partial.slice(0, 5).map(record => readableCell(record.fields[identityFields[1]]) || readableCell(record.fields[identityFields[0]])).join('、');
  throw new Error(`“${target}”匹配到多条记录：${names}。请改用赛事 ID 或完整名称。`);
}

function toTimestamp(value: string): number {
  if (/^(现在|当前时间|today|now)$/i.test(value)) return Date.now();
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+08:00` : value;
  const parsed = new Date(source).getTime();
  if (Number.isNaN(parsed)) throw new Error(`无法识别日期“${value}”，请使用 YYYY-MM-DD。`);
  return parsed;
}

function convertValue(field: string, value: string, definition: FieldDefinition): unknown {
  if (/^(清空|null|空)$/i.test(value)) return null;
  if (definition.type === 'text') return value;
  if (definition.type === 'datetime') return toTimestamp(value);
  if (definition.type === 'checkbox') return /^(是|true|1|已上线)$/i.test(value);
  if (definition.type === 'select') {
    if (definition.options && !definition.options.includes(value)) {
      throw new Error(`${field} 仅支持：${definition.options.join('、')}`);
    }
    return value;
  }
  const values = value.split(/[、,，/]/).map(item => item.trim()).filter(Boolean);
  const invalid = values.filter(item => definition.options && !definition.options.includes(item));
  if (invalid.length) throw new Error(`${field} 不支持：${invalid.join('、')}；可选：${definition.options?.join('、')}`);
  return values;
}

function prepareFields(input: Record<string, string>, definitions: Record<string, FieldDefinition>): Record<string, unknown> {
  const entries = Object.entries(input);
  if (!entries.length) throw new Error('没有识别到需要写入的字段。');
  const output: Record<string, unknown> = {};
  for (const [field, value] of entries) {
    const definition = definitions[field];
    if (!definition) throw new Error(`不允许修改字段“${field}”。`);
    output[field] = convertValue(field, value, definition);
  }
  return output;
}

function formatEventRecords(records: FeishuBaseRecord[]): string {
  if (!records.length) return '没有找到匹配的赛事。';
  return records.slice(0, 8).map((record, index) => {
    const fields = record.fields;
    return [
      `${index + 1}. ${readableCell(fields.赛事名称) || '未命名赛事'}（${readableCell(fields.赛事ID) || '无ID'}）`,
      `主办方：${readableCell(fields.主办方) || '待补充'}｜建联：${readableCell(fields.建联状态) || '待建联'}`,
      `负责人：${readableCell(fields.建联负责人) || '未分配'}｜下一步：${readableCell(fields.下一步) || '待安排'}`,
    ].join('\n');
  }).join('\n\n');
}

function formatPartnerRecords(records: FeishuBaseRecord[]): string {
  if (!records.length) return '没有找到匹配的合作方。';
  return records.slice(0, 8).map((record, index) => {
    const fields = record.fields;
    const name = readableCell(fields.主办方) || readableCell(fields.主办方名字) || '未命名合作方';
    return [
      `${index + 1}. ${name}`,
      `赛事：${readableCell(fields.赛事名称) || '待补充'}｜状态：${readableCell(fields.建联状态) || '待补充'}`,
      `负责人：${readableCell(fields.跟进负责人) || '未分配'}｜联系人：${readableCell(fields.联系人) || '待补充'}｜下一步：${readableCell(fields.下一步) || '待安排'}`,
    ].join('\n');
  }).join('\n\n');
}

function sanitizeIntent(intent: AgentIntent): AgentIntent {
  const definitions = intent.type === 'propose_event_update' ? eventFields : partnerFields;
  const allowedFields = Object.fromEntries(
    Object.entries(intent.fields || {}).filter(([field, value]) => definitions[field] && String(value).trim()),
  );
  return { ...intent, fields: allowedFields };
}

async function classifyWithDeepSeek(config: FeishuAgentConfig, text: string): Promise<AgentIntent> {
  if (!config.deepseekApiKey) return { type: 'help' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${config.deepseekBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.deepseekApiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.deepseekModel,
        temperature: 0,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `你是 HackerTrip 赛事合作数据助手，只负责把群消息分类为 JSON，不得编造数据。\n类型只能是 query_event、query_partner、query_pending、overview、propose_event_update、propose_partner_update、propose_partner_create、help。\n返回结构：{"type":"...","query":"搜索词","target":"赛事ID/名称或合作方名称","fields":{"真实字段名":"值"}}。\n赛事可写字段：${Object.keys(eventFields).join('、')}。\n合作方可写字段：${Object.keys(partnerFields).join('、')}。\n用户描述已联系、已回复、负责人、联系人、下一步等变化时，只生成 propose，不直接写。若消息主要是在找赛事或合作方，生成 query。`,
          },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!response.ok) return { type: 'help' };
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, '')) as AgentIntent;
    return sanitizeIntent(parsed);
  } catch {
    return { type: 'help' };
  } finally {
    clearTimeout(timeout);
  }
}

async function executeConfirmedCommand(client: FeishuAgentClient, config: FeishuAgentConfig, command: ConfirmedCommand): Promise<string> {
  if (command.action === 'update_event') {
    const records = await client.listRecords(config.eventBaseToken, config.eventTableId);
    const target = findUniqueRecord(records, command.target, ['赛事ID', '赛事名称', '候选ID']);
    const fields = prepareFields(command.fields, eventFields);
    if (!('最近跟进时间' in fields) && Object.keys(fields).some(field => field.includes('联系') || field === '建联状态' || field === '下一步')) {
      fields.最近跟进时间 = Date.now();
    }
    await client.updateRecord(config.eventBaseToken, config.eventTableId, target.record_id, fields);
    return `✅ 已更新赛事：${readableCell(target.fields.赛事名称)}\n${Object.entries(command.fields).map(([key, value]) => `• ${key}：${value}`).join('\n')}`;
  }

  if (command.action === 'update_partner') {
    const records = await client.listRecords(config.partnerBaseToken, config.partnerTableId);
    const target = findUniqueRecord(records, command.target, ['赛事ID', '主办方', '主办方名字', '赛事名称']);
    const fields = prepareFields(command.fields, partnerFields);
    if (!('最近跟进时间' in fields)) fields.最近跟进时间 = Date.now();
    await client.updateRecord(config.partnerBaseToken, config.partnerTableId, target.record_id, fields);
    const name = readableCell(target.fields.主办方) || readableCell(target.fields.主办方名字);
    return `✅ 已更新合作方：${name}\n${Object.entries(command.fields).map(([key, value]) => `• ${key}：${value}`).join('\n')}`;
  }

  const fields = prepareFields(command.fields, partnerFields);
  const name = readableCell(fields.主办方) || readableCell(fields.主办方名字);
  if (!name) throw new Error('新增合作方必须填写“主办方”或“主办方名字”。');
  const records = await client.listRecords(config.partnerBaseToken, config.partnerTableId);
  const duplicate = records.find(record => [readableCell(record.fields.主办方), readableCell(record.fields.主办方名字)].some(value => value.toLowerCase() === name.toLowerCase()));
  if (duplicate) throw new Error(`合作方“${name}”已存在，请使用“确认更新合作方”。`);
  if (!('最近跟进时间' in fields)) fields.最近跟进时间 = Date.now();
  const created = await client.createRecord(config.partnerBaseToken, config.partnerTableId, fields);
  return `✅ 已新增合作方：${name}\n记录ID：${created.record_id}`;
}

async function executeIntent(client: FeishuAgentClient, config: FeishuAgentConfig, intent: AgentIntent): Promise<string> {
  if (intent.type === 'help') return helpText;
  if (intent.type === 'query_event') {
    const records = await client.listRecords(config.eventBaseToken, config.eventTableId);
    return formatEventRecords(filterRecords(records, intent.query || '', ['赛事ID', '赛事名称', '主办方', '城市', '建联状态', '建联负责人']));
  }
  if (intent.type === 'query_partner') {
    const records = await client.listRecords(config.partnerBaseToken, config.partnerTableId);
    return formatPartnerRecords(filterRecords(records, intent.query || '', ['主办方', '主办方名字', '赛事名称', '赛事ID', '联系人', '跟进负责人']));
  }
  if (intent.type === 'query_pending') {
    const records = await client.listRecords(config.eventBaseToken, config.crawlerTableId);
    const pending = records.filter(record => readableCell(record.fields.审核状态).includes('待审核'));
    if (!pending.length) return '当前没有待审核赛事。';
    return `当前待审核 ${pending.length} 条：\n${pending.slice(0, 10).map((record, index) => `${index + 1}. ${readableCell(record.fields.赛事名称)}（${readableCell(record.fields.候选ID)}，置信度 ${readableCell(record.fields.置信度) || '待评估'}）`).join('\n')}`;
  }
  if (intent.type === 'overview') {
    const events = await client.listRecords(config.eventBaseToken, config.eventTableId);
    const partners = await client.listRecords(config.partnerBaseToken, config.partnerTableId);
    const candidates = await client.listRecords(config.eventBaseToken, config.crawlerTableId);
    const pending = candidates.filter(record => readableCell(record.fields.审核状态).includes('待审核')).length;
    const outreach = events.filter(record => ['已联系', '已回复', '建联成功'].includes(readableCell(record.fields.建联状态))).length;
    return `HackerTrip 数据概览\n• 正式赛事：${events.length}\n• 待审核赛事：${pending}\n• 已进入建联流程：${outreach}\n• 合作方记录：${partners.length}`;
  }

  const sanitized = sanitizeIntent(intent);
  if (!sanitized.target && sanitized.type !== 'propose_partner_create') return '我识别到了更新意图，但缺少明确的赛事或合作方名称。请补充目标。';
  if (!Object.keys(sanitized.fields || {}).length) return '我识别到了更新意图，但没有识别到可写字段。请补充状态、负责人、联系人或下一步。';
  return [
    '我识别到以下数据变更，请核对：',
    ...Object.entries(sanitized.fields || {}).map(([key, value]) => `• ${key}：${value}`),
    '',
    '确认无误后，请再次 @我并原样发送：',
    buildConfirmationCommand(sanitized),
  ].join('\n');
}

export async function handleAgentMessage(config: FeishuAgentConfig, text: string): Promise<string> {
  const client = new FeishuAgentClient(config);
  const confirmed = parseConfirmedCommand(text);
  if (confirmed) return executeConfirmedCommand(client, config, confirmed);
  const intent = directIntent(text) || await classifyWithDeepSeek(config, text);
  return executeIntent(client, config, intent);
}

export { eventFields, partnerFields, helpText };
