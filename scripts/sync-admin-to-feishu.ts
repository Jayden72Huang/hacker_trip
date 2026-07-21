/**
 * 运营审核同步（小程序云库 ⇄ 飞书）— 无头版，通过 opsReviewSync 云函数 HTTP 端点读写，不依赖微信开发者工具。
 *
 * 一次运行完成完整闭环：
 *   1. export       —— 从云库拉全部组织者申请 + 赛事草稿
 *   2. 反向(先跑)   —— 飞书表里被改成「已通过/已拒绝」且云库仍待审核的 → 调 apply 写回云库(并通知申请人)
 *   3. re-export    —— 重新拉云库，拿到反向写回后的最新状态
 *   4. 正向         —— 云库 → 飞书子表(组织者申请/赛事申请)，已通过草稿回写赛事总表
 *   5. 群提醒       —— 本轮新进的待审核申请 → 推 HackerTrip 审核群
 *
 * 反向先于正向：避免正向把审核员刚在飞书改的决定覆盖回「待审核」。
 *
 * 用法:
 *   npx tsx scripts/sync-admin-to-feishu.ts            # 全量同步
 *   npx tsx scripts/sync-admin-to-feishu.ts --dry-run   # 预览不写入不发消息
 */
import { execSync, execFileSync } from 'child_process';
import { hackathonOpsConfig, hasReviewPushTarget, hasOpsEndpoint } from './lib/hackathon-ops-config';

const FEISHU_BASE_TOKEN = hackathonOpsConfig.eventBaseToken;
const DRAFT_TABLE_ID = hackathonOpsConfig.draftApplyTableId;       // 赛事申请
const ORGANIZER_TABLE_ID = hackathonOpsConfig.organizerApplyTableId; // 组织者申请
const MAIN_TABLE_ID = hackathonOpsConfig.eventMainTableId;         // 赛事总表

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

interface NewApplyItem { kind: '组织者' | '赛事'; title: string; contact: string; }
const newPendingItems: NewApplyItem[] = [];

// ── opsReviewSync HTTP 端点 ────────────────────────────

async function opsRequest(body: Record<string, any>): Promise<any> {
  const res = await fetch(hackathonOpsConfig.opsSyncUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ops-token': hackathonOpsConfig.opsSyncToken },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`opsReviewSync 返回无法解析: ${text.slice(0, 200)}`); }
  if (!json.ok) throw new Error(`opsReviewSync ${body.action} 失败: ${json.code || ''} ${json.message || ''}`);
  return json;
}

async function opsExport(): Promise<{ organizers: any[]; drafts: any[] }> {
  const res = await opsRequest({ action: 'export' });
  return { organizers: res.organizers || [], drafts: res.drafts || [] };
}

interface ApplyItem { kind: 'organizer' | 'draft'; id: string; decision: 'approve' | 'reject'; reason?: string; }
async function opsApply(items: ApplyItem[]): Promise<any[]> {
  if (items.length === 0) return [];
  const res = await opsRequest({ action: 'apply', items });
  return res.results || [];
}

// ── 飞书读取 ───────────────────────────────────────────

interface FeishuRecord { record_id: string; fields: Record<string, any>; }

function readFeishuTable(tableId: string): FeishuRecord[] {
  const allRecords: FeishuRecord[] = [];
  let pageToken = '';
  let hasMore = true;
  while (hasMore) {
    const cmd = `lark-cli base +record-list --base-token ${FEISHU_BASE_TOKEN} --table-id ${tableId} --limit 200 --as user --format json${pageToken ? ` --page-token ${pageToken}` : ''}`;
    const raw = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
    const result = JSON.parse(raw);
    if (!result.ok) throw new Error(`Feishu API error: ${JSON.stringify(result.error)}`);
    const fieldNames: string[] = result.data?.fields || [];
    const rows: any[][] = result.data?.data || [];
    const recordIds: string[] = result.data?.record_id_list || [];
    for (let i = 0; i < rows.length; i++) {
      const fields: Record<string, any> = {};
      for (let j = 0; j < fieldNames.length; j++) fields[fieldNames[j]] = rows[i]?.[j] ?? null;
      allRecords.push({ record_id: recordIds[i] || '', fields });
    }
    hasMore = result.data?.has_more === true;
    pageToken = result.data?.page_token || '';
  }
  return allRecords;
}

// ── 飞书写入 ───────────────────────────────────────────

// 飞书写入带重试：连续写同一表易触发并发限频(1254291)等瞬时错误，退避重试最多 3 次
function larkWrite(cmdArgs: string[], timeout: number) {
  const delays = [400, 1000, 2000];
  for (let attempt = 0; ; attempt++) {
    try {
      execFileSync('lark-cli', cmdArgs, { encoding: 'utf-8', timeout });
      return;
    } catch (e: any) {
      const msg = String((e && (e.stdout || e.message)) || '');
      const transient = /1254291|frequency|frequently|timeout|ETIMEDOUT|ECONNRESET/i.test(msg);
      if (attempt >= delays.length || !transient) throw e;
      execSync(`sleep ${(delays[attempt] / 1000).toFixed(2)}`);
    }
  }
}

// 新版 lark-cli：批量建记录用 --json {"fields":[列名],"rows":[[值]]}；execFileSync 免 shell 转义
function feishuBatchCreate(tableId: string, records: Record<string, any>[]) {
  if (records.length === 0) return;
  const fieldNames = Array.from(new Set(records.flatMap(r => Object.keys(r))));
  const rows = records.map(r => fieldNames.map(k => (r[k] === undefined ? null : r[k])));
  const json = JSON.stringify({ fields: fieldNames, rows });
  larkWrite(['base', '+record-batch-create', '--base-token', FEISHU_BASE_TOKEN, '--table-id', tableId, '--json', json, '--as', 'user'], 30000);
}

// 新版 lark-cli：单条更新走 batch-update，record_id_list 单元素 + patch
function feishuRecordUpdate(tableId: string, recordId: string, fields: Record<string, any>) {
  const json = JSON.stringify({ record_id_list: [recordId], patch: fields });
  larkWrite(['base', '+record-batch-update', '--base-token', FEISHU_BASE_TOKEN, '--table-id', tableId, '--json', json, '--as', 'user'], 15000);
}

// ── 状态映射 ───────────────────────────────────────────

const draftStatusMap: Record<string, string> = {
  pending_review: '待审核',
  pending_manual_review: '待审核',
  security_review: '安全审查中',
  approved: '已通过',
  rejected: '已拒绝',
};
const orgStatusMap: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
const modeMap: Record<string, string> = { offline: '线下', online: '线上', hybrid: '混合' };

// 云库状态是否仍处于「待审核」（可被反向审核决定改写）
const ORG_PENDING = new Set(['pending', '', undefined]);
const DRAFT_PENDING = new Set(['pending_review', 'pending_manual_review', 'security_review', '', undefined]);

function formatTimestamp(ts: any): string {
  if (!ts) return '';
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (isNaN(n) || n === 0) return '';
  return new Date(n).toISOString().replace('T', ' ').slice(0, 19);
}

// ── 反向：飞书审核决定 → 写回云库 ───────────────────────

async function syncReverse(cloud: { organizers: any[]; drafts: any[] }) {
  console.log('\n↩️  反向同步：飞书审核决定 → 云库...');
  const decisions: ApplyItem[] = [];

  // 组织者
  const orgCloudById = new Map(cloud.organizers.map(o => [o._id, o]));
  for (const r of readFeishuTable(ORGANIZER_TABLE_ID)) {
    const docId = String(r.fields['云DB文档ID'] || '').trim();
    const status = String(r.fields['状态'] || '').trim();
    if (!docId || !orgCloudById.has(docId)) continue;
    const cloudStatus = String(orgCloudById.get(docId).status || '');
    if (status === '已通过' && ORG_PENDING.has(cloudStatus)) decisions.push({ kind: 'organizer', id: docId, decision: 'approve' });
    else if (status === '已拒绝' && ORG_PENDING.has(cloudStatus)) decisions.push({ kind: 'organizer', id: docId, decision: 'reject', reason: String(r.fields['备注'] || '未通过人工审核') });
  }

  // 赛事草稿
  const draftCloudById = new Map(cloud.drafts.map(d => [d._id, d]));
  for (const r of readFeishuTable(DRAFT_TABLE_ID)) {
    const docId = String(r.fields['云DB文档ID'] || '').trim();
    const status = String(r.fields['状态'] || '').trim();
    if (!docId || !draftCloudById.has(docId)) continue;
    const cloudStatus = String(draftCloudById.get(docId).status || '');
    if (status === '已通过' && DRAFT_PENDING.has(cloudStatus)) decisions.push({ kind: 'draft', id: docId, decision: 'approve' });
    else if (status === '已拒绝' && DRAFT_PENDING.has(cloudStatus)) decisions.push({ kind: 'draft', id: docId, decision: 'reject', reason: '信息需补充或未通过人工审核' });
  }

  if (decisions.length === 0) { console.log('   ⏭️  无待写回的审核决定'); return; }
  if (DRY_RUN) { decisions.forEach(d => console.log(`   [dry-run] ${d.kind} ${d.id} → ${d.decision}`)); return; }

  const results = await opsApply(decisions);
  const okCount = results.filter((r: any) => r.ok).length;
  console.log(`   ✅ 写回云库: ${okCount}/${decisions.length} 成功（已触发申请人通知）`);
  results.filter((r: any) => !r.ok).forEach((r: any) => console.log(`   ⚠️  ${r.kind} ${r.id} 失败: ${r.message || JSON.stringify(r.result)}`));
}

// ── 正向：云库 → 飞书子表 ──────────────────────────────

function syncDrafts(drafts: any[]) {
  console.log('\n📋 同步赛事申请...');
  console.log(`   云 DB hackathon_drafts: ${drafts.length} 条`);
  if (drafts.length === 0) { console.log('   ⏭️  无赛事申请数据'); return; }

  const existing = readFeishuTable(DRAFT_TABLE_ID);
  const existingDocIds = new Map<string, string>();
  for (const r of existing) { const d = String(r.fields['云DB文档ID'] || '').trim(); if (d) existingDocIds.set(d, r.record_id); }
  console.log(`   飞书赛事申请表: ${existing.length} 条已有记录`);

  const toCreate: Record<string, any>[] = [];
  let updated = 0;
  for (const d of drafts) {
    const docId = d._id || '';
    const fields: Record<string, any> = {
      '赛事名称': d.name || '', '城市': d.city || '', '形式': modeMap[d.mode] || d.mode || '',
      '开始日期': d.startDate || '', '结束日期': d.endDate || '', '奖金池': d.prizePool || '',
      '赛道': Array.isArray(d.tracks) ? d.tracks.join('/') : (d.tracks || ''), '官网': d.website || '',
      '简介': d.summary || '', '主办方': d.organizerName || '', '申请人OpenID': d.openid || '',
      '状态': draftStatusMap[d.status] || d.status || '', '提交时间': formatTimestamp(d.submittedAt),
      '审核时间': formatTimestamp(d.reviewedAt), '云DB文档ID': docId,
    };
    if (DRY_RUN) { console.log(`   [dry-run] ${existingDocIds.has(docId) ? '更新' : '新增'}: ${d.name}`); continue; }
    if (existingDocIds.has(docId)) {
      try { feishuRecordUpdate(DRAFT_TABLE_ID, existingDocIds.get(docId)!, fields); updated++; }
      catch (e: any) { console.log(`   ⚠️  更新失败 ${d.name}: ${e.message}`); }
    } else {
      toCreate.push(fields);
      if (DRAFT_PENDING.has(String(d.status))) newPendingItems.push({ kind: '赛事', title: d.name || '(未命名赛事)', contact: d.organizerName || '' });
    }
  }
  if (!DRY_RUN && toCreate.length > 0) feishuBatchCreate(DRAFT_TABLE_ID, toCreate);
  console.log(`   ✅ 赛事申请: 新增 ${toCreate.length} 条，更新 ${updated} 条`);
}

function syncOrganizers(orgs: any[]) {
  console.log('\n👤 同步组织者申请...');
  console.log(`   云 DB organizer_applications: ${orgs.length} 条`);
  if (orgs.length === 0) { console.log('   ⏭️  无组织者申请数据'); return; }

  const existing = readFeishuTable(ORGANIZER_TABLE_ID);
  const existingDocIds = new Map<string, string>();
  for (const r of existing) { const d = String(r.fields['云DB文档ID'] || '').trim(); if (d) existingDocIds.set(d, r.record_id); }
  console.log(`   飞书组织者申请表: ${existing.length} 条已有记录`);

  const toCreate: Record<string, any>[] = [];
  let updated = 0;
  for (const o of orgs) {
    const docId = o._id || '';
    const fields: Record<string, any> = {
      '组织名称': o.orgName || '', '联系人': o.role || '', '联系方式': o.contact || '',
      '身份角色': o.role || '', '官网': o.website || '', '备注': o.note || '',
      '申请人OpenID': o.openid || '', '状态': orgStatusMap[o.status] || o.status || '',
      '提交时间': formatTimestamp(o.submittedAt), '审核时间': formatTimestamp(o.reviewedAt), '云DB文档ID': docId,
    };
    if (DRY_RUN) { console.log(`   [dry-run] ${existingDocIds.has(docId) ? '更新' : '新增'}: ${o.orgName}`); continue; }
    if (existingDocIds.has(docId)) {
      try { feishuRecordUpdate(ORGANIZER_TABLE_ID, existingDocIds.get(docId)!, fields); updated++; }
      catch (e: any) { console.log(`   ⚠️  更新失败 ${o.orgName}: ${e.message}`); }
    } else {
      toCreate.push(fields);
      if (ORG_PENDING.has(String(o.status))) newPendingItems.push({ kind: '组织者', title: o.orgName || '(未填机构)', contact: o.contact || '' });
    }
  }
  if (!DRY_RUN && toCreate.length > 0) feishuBatchCreate(ORGANIZER_TABLE_ID, toCreate);
  console.log(`   ✅ 组织者申请: 新增 ${toCreate.length} 条，更新 ${updated} 条`);
}

function syncApprovedToMainTable(drafts: any[]) {
  console.log('\n📊 检查已通过的赛事草稿 → 回写赛事总表...');
  const approved = drafts.filter(d => d.status === 'approved' && d.publishedHackathonId);
  if (approved.length === 0) { console.log('   ⏭️  无已通过的赛事需要回写'); return; }

  const existing = readFeishuTable(MAIN_TABLE_ID);
  const existingNames = new Set(existing.map(r => String(r.fields['赛事名称'] || '').trim().toLowerCase()));
  const existingIds = new Set(existing.map(r => String(r.fields['赛事ID'] || '').trim()));

  const toCreate: Record<string, any>[] = [];
  for (const d of approved) {
    const name = (d.name || '').trim();
    const hackathonId = d.publishedHackathonId || '';
    if (existingNames.has(name.toLowerCase()) || existingIds.has(hackathonId)) continue;
    const fields: Record<string, any> = {
      '赛事ID': hackathonId, '赛事名称': name, '城市': d.city || '', '形式': modeMap[d.mode] || d.mode || '线下',
      '开始日期': d.startDate || '', '结束日期': d.endDate || '', '奖金池': d.prizePool || '',
      '赛道': Array.isArray(d.tracks) ? d.tracks.join('/') : (d.tracks || ''), '官网': d.website || '',
      '简介': d.summary || '', '主办方': d.organizerName || '', '已上线': true, '上线平台': ['小程序'],
    };
    if (DRY_RUN) console.log(`   [dry-run] 回写主表: ${name}`); else toCreate.push(fields);
  }
  if (!DRY_RUN && toCreate.length > 0) feishuBatchCreate(MAIN_TABLE_ID, toCreate);
  console.log(`   ✅ 回写赛事总表: ${toCreate.length} 条新增`);
}

// ── 审核群提醒 ─────────────────────────────────────────

function sendReviewNotification() {
  if (newPendingItems.length === 0) { console.log('\n🔕 无新申请，跳过群提醒'); return; }
  if (!hasReviewPushTarget()) { console.log(`\n⚠️  有 ${newPendingItems.length} 条新申请，但未配置审核群(FEISHU_REVIEW_CHAT_ID)，跳过推送`); return; }

  const orgCount = newPendingItems.filter(i => i.kind === '组织者').length;
  const eventCount = newPendingItems.filter(i => i.kind === '赛事').length;
  const markdown = [
    `**🆕 HackerTrip 新审核申请（${newPendingItems.length} 条）**`,
    orgCount ? `👤 组织者申请 ${orgCount} 条` : '',
    eventCount ? `📋 赛事上线申请 ${eventCount} 条` : '',
    '',
    ...newPendingItems.slice(0, 10).map(i => `- [${i.kind}] ${i.title}${i.contact ? ` · ${i.contact}` : ''}`),
    newPendingItems.length > 10 ? `… 其余 ${newPendingItems.length - 10} 条见表格` : '',
    '',
    `👉 [去飞书表格审核](https://${hackathonOpsConfig.feishuBaseDomain}/base/${FEISHU_BASE_TOKEN})`,
  ].filter(Boolean).join('\n');

  if (DRY_RUN) { console.log('\n📨 [dry-run] 将推送审核群提醒:\n' + markdown); return; }
  try {
    const idempotencyKey = `admin-sync-${new Date().toISOString().slice(0, 13)}-${newPendingItems.length}`;
    execFileSync('lark-cli', ['im', '+messages-send', '--chat-id', hackathonOpsConfig.reviewChatId, '--markdown', markdown, '--idempotency-key', idempotencyKey, '--as', hackathonOpsConfig.feishuIdentity], { encoding: 'utf-8', timeout: 20000 });
    console.log(`\n📨 已推送审核群提醒（${newPendingItems.length} 条新申请）`);
  } catch (e: any) { console.log(`\n⚠️  审核群提醒推送失败: ${e.message}`); }
}

// ── 主流程 ─────────────────────────────────────────────

async function main() {
  console.log(`🔄 运营审核同步（云库 ⇄ 飞书）${DRY_RUN ? ' [预览模式]' : ''}`);
  console.log('─'.repeat(48));

  if (!hasOpsEndpoint()) {
    console.error('❌ 未配置 opsReviewSync 端点（opsSyncUrl / opsSyncToken）');
    console.log('💡 在云端控制台给 opsReviewSync 建 HTTP 触发器，把地址填进 config/hackathon-ops.local.json 的 opsSyncUrl');
    process.exit(1);
  }

  // 1. 拉云库当前状态
  let cloud = await opsExport();
  console.log(`✅ 云库已连接（组织者 ${cloud.organizers.length} / 草稿 ${cloud.drafts.length}）`);

  // 2. 反向先跑：把飞书里的审核决定写回云库（避免被正向覆盖）
  await syncReverse(cloud);

  // 3. 重新拉云库，拿到反向写回后的最新状态，供正向使用
  if (!DRY_RUN) cloud = await opsExport();

  // 4. 正向：云库 → 飞书
  syncOrganizers(cloud.organizers);
  syncDrafts(cloud.drafts);
  syncApprovedToMainTable(cloud.drafts);

  // 5. 新申请群提醒
  sendReviewNotification();

  console.log(`\n${'─'.repeat(48)}`);
  console.log('✅ 审核同步完成！');
  console.log(`📖 飞书打开查看: https://${hackathonOpsConfig.feishuBaseDomain}/base/${FEISHU_BASE_TOKEN}`);
}

main().catch(err => { console.error('❌ 同步失败:', err.message); process.exit(1); });
