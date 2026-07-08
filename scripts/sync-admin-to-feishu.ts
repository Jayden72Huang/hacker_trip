/**
 * 小程序审核台 → 飞书同步脚本
 *
 * 将云 DB 的审核数据同步到飞书子表，让主办方提交的赛事和组织者申请在飞书可见：
 *   - hackathon_drafts → 飞书「赛事申请」
 *   - organizer_applications → 飞书「组织者申请」
 *   - 已通过的赛事草稿 → 飞书「赛事总表」(自动回写)
 *
 * 用法:
 *   npx tsx scripts/sync-admin-to-feishu.ts            # 全量同步
 *   npx tsx scripts/sync-admin-to-feishu.ts --dry-run   # 预览不写入
 */
import { execSync } from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FEISHU_BASE_TOKEN = 'WeUkbz9xRax4iKs8x1Lcjr6Sn4e';
const DRAFT_TABLE_ID = 'tblhkHwmLGSveNJZ';      // 赛事申请
const ORGANIZER_TABLE_ID = 'tblICsjnS0thnizf';   // 组织者申请
const MAIN_TABLE_ID = 'tblHGtaEqzNtYJja';        // 赛事总表

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ── DevTools Automator ─────────────────────────────────

function postAutomator(body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 9420,
      path: '/api',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 15000,
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(null); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function readCloudCollection(collection: string): Promise<any[]> {
  const expr = `(async function() {
    const db = wx.cloud.database();
    const countRes = await db.collection('${collection}').count();
    const total = countRes.total || 0;
    if (total === 0) return [];
    const batchSize = 20;
    const tasks = [];
    for (let i = 0; i < total; i += batchSize) {
      tasks.push(db.collection('${collection}').skip(i).limit(batchSize).get());
    }
    const results = await Promise.all(tasks);
    return results.reduce((acc, r) => acc.concat(r.data || []), []);
  })()`;

  const res = await postAutomator({ method: 'evaluate', params: { expression: expr } });
  if (!res?.result) return [];

  let parsed = res.result;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  return Array.isArray(parsed) ? parsed : [];
}

// ── 飞书读取 ───────────────────────────────────────────

interface FeishuRecord {
  record_id: string;
  fields: Record<string, any>;
}

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
      for (let j = 0; j < fieldNames.length; j++) {
        fields[fieldNames[j]] = rows[i]?.[j] ?? null;
      }
      allRecords.push({ record_id: recordIds[i] || '', fields });
    }

    hasMore = result.data?.has_more === true;
    pageToken = result.data?.page_token || '';
  }

  return allRecords;
}

// ── 飞书写入 ───────────────────────────────────────────

function feishuBatchCreate(tableId: string, records: Record<string, any>[]) {
  if (records.length === 0) return;
  const tmpFile = path.join(os.tmpdir(), `feishu-sync-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(records));
  try {
    const cmd = `lark-cli base +record-batch-create --base-token ${FEISHU_BASE_TOKEN} --table-id ${tableId} --file ${tmpFile} --as user`;
    execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function feishuRecordUpdate(tableId: string, recordId: string, fields: Record<string, any>) {
  const fieldsJson = JSON.stringify(fields);
  const cmd = `lark-cli base +record-update --base-token ${FEISHU_BASE_TOKEN} --table-id ${tableId} --record-id ${recordId} --fields '${fieldsJson.replace(/'/g, "'\\''")}' --as user`;
  execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
}

// ── 状态映射 ───────────────────────────────────────────

const draftStatusMap: Record<string, string> = {
  pending_review: '待审核',
  pending_manual_review: '待审核',
  security_review: '安全审查中',
  approved: '已通过',
  rejected: '已拒绝',
};

const orgStatusMap: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

function formatTimestamp(ts: any): string {
  if (!ts) return '';
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (isNaN(n) || n === 0) return '';
  return new Date(n).toISOString().replace('T', ' ').slice(0, 19);
}

const modeMap: Record<string, string> = { offline: '线下', online: '线上', hybrid: '混合' };

// ── 同步赛事申请 ───────────────────────────────────────

async function syncDrafts() {
  console.log('\n📋 同步赛事申请...');

  const drafts = await readCloudCollection('hackathon_drafts');
  console.log(`   云 DB hackathon_drafts: ${drafts.length} 条`);
  if (drafts.length === 0) {
    console.log('   ⏭️  无赛事申请数据');
    return;
  }

  const existing = readFeishuTable(DRAFT_TABLE_ID);
  const existingDocIds = new Map<string, string>();
  for (const r of existing) {
    const docId = String(r.fields['云DB文档ID'] || '').trim();
    if (docId) existingDocIds.set(docId, r.record_id);
  }
  console.log(`   飞书赛事申请表: ${existing.length} 条已有记录`);

  const toCreate: Record<string, any>[] = [];
  let updated = 0;

  for (const d of drafts) {
    const docId = d._id || '';
    const fields: Record<string, any> = {
      '赛事名称': d.name || '',
      '城市': d.city || '',
      '形式': modeMap[d.mode] || d.mode || '',
      '开始日期': d.startDate || '',
      '结束日期': d.endDate || '',
      '奖金池': d.prizePool || '',
      '赛道': Array.isArray(d.tracks) ? d.tracks.join('/') : (d.tracks || ''),
      '官网': d.website || '',
      '简介': d.summary || '',
      '主办方': d.organizerName || '',
      '申请人OpenID': d.openid || '',
      '状态': draftStatusMap[d.status] || d.status || '',
      '提交时间': formatTimestamp(d.submittedAt),
      '审核时间': formatTimestamp(d.reviewedAt),
      '云DB文档ID': docId,
    };

    if (DRY_RUN) {
      const action = existingDocIds.has(docId) ? '更新' : '新增';
      console.log(`   [dry-run] ${action}: ${d.name} (${draftStatusMap[d.status] || d.status})`);
      continue;
    }

    if (existingDocIds.has(docId)) {
      try {
        feishuRecordUpdate(DRAFT_TABLE_ID, existingDocIds.get(docId)!, fields);
        updated++;
      } catch (e: any) {
        console.log(`   ⚠️  更新失败 ${d.name}: ${e.message}`);
      }
    } else {
      toCreate.push(fields);
    }
  }

  if (!DRY_RUN && toCreate.length > 0) {
    feishuBatchCreate(DRAFT_TABLE_ID, toCreate);
  }
  console.log(`   ✅ 赛事申请: 新增 ${toCreate.length} 条，更新 ${updated} 条`);
}

// ── 同步组织者申请 ─────────────────────────────────────

async function syncOrganizers() {
  console.log('\n👤 同步组织者申请...');

  const orgs = await readCloudCollection('organizer_applications');
  console.log(`   云 DB organizer_applications: ${orgs.length} 条`);
  if (orgs.length === 0) {
    console.log('   ⏭️  无组织者申请数据');
    return;
  }

  const existing = readFeishuTable(ORGANIZER_TABLE_ID);
  const existingDocIds = new Map<string, string>();
  for (const r of existing) {
    const docId = String(r.fields['云DB文档ID'] || '').trim();
    if (docId) existingDocIds.set(docId, r.record_id);
  }
  console.log(`   飞书组织者申请表: ${existing.length} 条已有记录`);

  const toCreate: Record<string, any>[] = [];
  let updated = 0;

  for (const o of orgs) {
    const docId = o._id || '';
    const fields: Record<string, any> = {
      '组织名称': o.orgName || '',
      '联系人': o.role || '',
      '联系方式': o.contact || '',
      '身份角色': o.role || '',
      '官网': o.website || '',
      '备注': o.note || '',
      '申请人OpenID': o.openid || '',
      '状态': orgStatusMap[o.status] || o.status || '',
      '提交时间': formatTimestamp(o.submittedAt),
      '审核时间': formatTimestamp(o.reviewedAt),
      '云DB文档ID': docId,
    };

    if (DRY_RUN) {
      const action = existingDocIds.has(docId) ? '更新' : '新增';
      console.log(`   [dry-run] ${action}: ${o.orgName} (${orgStatusMap[o.status] || o.status})`);
      continue;
    }

    if (existingDocIds.has(docId)) {
      try {
        feishuRecordUpdate(ORGANIZER_TABLE_ID, existingDocIds.get(docId)!, fields);
        updated++;
      } catch (e: any) {
        console.log(`   ⚠️  更新失败 ${o.orgName}: ${e.message}`);
      }
    } else {
      toCreate.push(fields);
    }
  }

  if (!DRY_RUN && toCreate.length > 0) {
    feishuBatchCreate(ORGANIZER_TABLE_ID, toCreate);
  }
  console.log(`   ✅ 组织者申请: 新增 ${toCreate.length} 条，更新 ${updated} 条`);
}

// ── 已通过的赛事回写赛事总表 ───────────────────────────

async function syncApprovedToMainTable() {
  console.log('\n📊 检查已通过的赛事草稿 → 回写赛事总表...');

  const drafts = await readCloudCollection('hackathon_drafts');
  const approved = drafts.filter(d => d.status === 'approved' && d.publishedHackathonId);
  if (approved.length === 0) {
    console.log('   ⏭️  无已通过的赛事需要回写');
    return;
  }

  const existing = readFeishuTable(MAIN_TABLE_ID);
  const existingNames = new Set(
    existing.map(r => String(r.fields['赛事名称'] || '').trim().toLowerCase())
  );
  const existingIds = new Set(
    existing.map(r => String(r.fields['赛事ID'] || '').trim())
  );

  const toCreate: Record<string, any>[] = [];
  for (const d of approved) {
    const name = (d.name || '').trim();
    const hackathonId = d.publishedHackathonId || '';
    if (existingNames.has(name.toLowerCase()) || existingIds.has(hackathonId)) {
      continue;
    }

    const fields: Record<string, any> = {
      '赛事ID': hackathonId,
      '赛事名称': name,
      '城市': d.city || '',
      '形式': modeMap[d.mode] || d.mode || '线下',
      '开始日期': d.startDate || '',
      '结束日期': d.endDate || '',
      '奖金池': d.prizePool || '',
      '赛道': Array.isArray(d.tracks) ? d.tracks.join('/') : (d.tracks || ''),
      '官网': d.website || '',
      '简介': d.summary || '',
      '主办方': d.organizerName || '',
      '已上线': true,
      '上线平台': ['小程序'],
    };

    if (DRY_RUN) {
      console.log(`   [dry-run] 回写主表: ${name}`);
    } else {
      toCreate.push(fields);
    }
  }

  if (!DRY_RUN && toCreate.length > 0) {
    feishuBatchCreate(MAIN_TABLE_ID, toCreate);
  }
  console.log(`   ✅ 回写赛事总表: ${toCreate.length} 条新增`);
}

// ── 主流程 ─────────────────────────────────────────────

async function main() {
  console.log(`🔄 小程序审核台 → 飞书同步${DRY_RUN ? ' [预览模式]' : ''}`);
  console.log('─'.repeat(48));

  // 检测 DevTools Automator
  try {
    await postAutomator({ method: 'evaluate', params: { expression: '1+1' } });
    console.log('✅ 微信开发者工具已连接');
  } catch {
    console.error('❌ 微信开发者工具未连接（需要打开开发者工具并启用自动化端口 9420）');
    console.log('💡 打开微信开发者工具 → 设置 → 安全 → 开启服务端口');
    process.exit(1);
  }

  await syncDrafts();
  await syncOrganizers();
  await syncApprovedToMainTable();

  console.log(`\n${'─'.repeat(48)}`);
  console.log('✅ 审核台同步完成！');
  console.log('📖 飞书打开查看: https://my.feishu.cn/base/WeUkbz9xRax4iKs8x1Lcjr6Sn4e');
}

main().catch(err => {
  console.error('❌ 同步失败:', err.message);
  process.exit(1);
});
