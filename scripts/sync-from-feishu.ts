/**
 * 飞书多维表格 → 双平台发布同步脚本
 *
 * 飞书「赛事总表」是唯一管理中心：
 *   - 勾选「已上线」+ 选择「上线平台」（网站/小程序）
 *   - 跑本脚本即可发布到 Neon DB（网站）和/或微信云 DB（小程序）
 *
 * 用法:
 *   npx tsx scripts/sync-from-feishu.ts            # 全量同步
 *   npx tsx scripts/sync-from-feishu.ts --dry-run   # 预览不写入
 *   npx tsx scripts/sync-from-feishu.ts --id ht-05  # 只同步某条
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
import * as crypto from 'crypto';
import * as path from 'path';
import * as http from 'http';

const FEISHU_BASE_TOKEN = 'WeUkbz9xRax4iKs8x1Lcjr6Sn4e';
const FEISHU_TABLE_ID = 'tblHGtaEqzNtYJja';
const MINIPROGRAM_DIR = path.resolve(__dirname, '../hackertrip-miniprogram');

// ── CLI 参数 ────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SINGLE_ID = args.find((a, i) => args[i - 1] === '--id') || '';

// ── 类型 ────────────────────────────────────────────────

interface FeishuRecord {
  record_id: string;
  fields: Record<string, any>;
}

interface HackathonRow {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  location: string;
  mode: string;
  theme: string;
  summary: string;
  prizePool: string;
  tracks: string[];
  techStack: string[];
  tags: string[];
  website: string;
  registrationDeadline: string | null;
  organizerName: string;
  isPublished: boolean;
  sourceUrl: string;
  platform: string;
  confidence: number | null;
  targetPlatforms: string[];
}

// ── 飞书读取 ────────────────────────────────────────────

function readFeishuTable(): FeishuRecord[] {
  console.log('📖 读取飞书赛事总表...');
  const allRecords: FeishuRecord[] = [];
  let pageToken = '';
  let hasMore = true;

  while (hasMore) {
    const cmd = `lark-cli base +record-list --base-token ${FEISHU_BASE_TOKEN} --table-id ${FEISHU_TABLE_ID} --limit 200 --as user --format json${pageToken ? ` --page-token ${pageToken}` : ''}`;
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

  console.log(`   ✅ 读取到 ${allRecords.length} 条记录`);
  return allRecords;
}

// ── 解析工具 ────────────────────────────────────────────

function parseSelectValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? v.text || v.name || '' : String(v)).filter(Boolean).join(', ');
  if (typeof val === 'object') return val.text || val.name || '';
  return String(val);
}

function parseMultiSelect(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? v.text || v.name || '' : String(v)).filter(Boolean);
  if (typeof val === 'string') return [val];
  return [];
}

function parseDateValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(val);
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') return val.split(' ')[0].split('T')[0];
  return '';
}

function stripMarkdownLink(text: string): string {
  const match = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return match ? match[2] : text;
}

function parseTextValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return stripMarkdownLink(val);
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? v.text || '' : String(v)).join('');
  if (typeof val === 'object') return val.text || val.value || '';
  return String(val);
}

function parseSlashSeparated(val: any): string[] {
  const text = parseTextValue(val);
  if (!text) return [];
  return text.split(/\s*[\/,]\s*/).filter(Boolean);
}

const modeReverseMap: Record<string, string> = { '线下': 'offline', '线上': 'online', '混合': 'hybrid' };

function recordToHackathon(record: FeishuRecord): HackathonRow {
  const f = record.fields;
  const modeText = parseSelectValue(f['形式']);
  return {
    id: parseTextValue(f['赛事ID']) || '',
    name: parseTextValue(f['赛事名称']) || '',
    shortName: parseTextValue(f['简称']) || '',
    startDate: parseDateValue(f['开始日期']),
    endDate: parseDateValue(f['结束日期']),
    city: parseTextValue(f['城市']) || '',
    country: parseTextValue(f['国家']) || '中国',
    location: parseTextValue(f['场地']) || '',
    mode: modeReverseMap[modeText] || 'offline',
    theme: parseTextValue(f['主题']) || '',
    summary: parseTextValue(f['简介']) || '',
    prizePool: parseTextValue(f['奖金池']) || '',
    tracks: parseSlashSeparated(f['赛道']),
    techStack: parseSlashSeparated(f['技术栈']),
    tags: parseSlashSeparated(f['标签']),
    website: parseTextValue(f['官网']) || '',
    registrationDeadline: parseDateValue(f['报名截止']) || null,
    organizerName: parseTextValue(f['主办方']) || '',
    isPublished: f['已上线'] === true,
    sourceUrl: parseTextValue(f['来源链接']) || '',
    platform: parseSelectValue(f['来源平台']) || '',
    confidence: typeof f['置信度'] === 'number' ? f['置信度'] : null,
    targetPlatforms: parseMultiSelect(f['上线平台']),
  };
}

// ── Slug 生成 ───────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `hackathon-${Date.now()}`;
}

// ── Neon 正式表 upsert ──────────────────────────────────

async function syncToNeon(rows: HackathonRow[], allFeishuIds: string[]) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('⚠️  DATABASE_URL 未配置，跳过 Neon 同步');
    return;
  }

  const websiteRows = rows.filter(h => h.isPublished && h.targetPlatforms.includes('网站'));
  console.log(`\n🗄️  同步到 Neon 正式表... (${websiteRows.length} 条上线网站)`);

  if (DRY_RUN) {
    websiteRows.forEach(h => console.log(`   [dry-run] 上线: ${h.id} - ${h.name}`));
    return;
  }

  const sql = neon(dbUrl);
  let upserted = 0;
  let created = 0;

  for (const h of websiteRows) {
    if (!h.name || !h.id) continue;

    const tracks = h.tracks.length ? JSON.stringify(h.tracks.map(t => ({ title: t }))) : null;
    const organizers = h.organizerName ? JSON.stringify([{ name: h.organizerName }]) : null;
    const location = [h.city, h.location].filter(Boolean).join(' · ');
    const mode = h.mode as 'offline' | 'online' | 'hybrid' || 'hybrid';

    const existing = await sql`
      SELECT id, slug FROM hackathon WHERE feishu_id = ${h.id} LIMIT 1
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE hackathon SET
          name = ${h.name},
          short_name = ${h.shortName || null},
          description = ${h.summary || null},
          summary = ${h.summary || null},
          website = ${h.website || h.sourceUrl || null},
          source_url = ${h.sourceUrl || h.website || null},
          start_date = ${h.startDate || null},
          end_date = ${h.endDate || null},
          registration_deadline = ${h.registrationDeadline || null},
          mode = ${mode},
          location = ${location || null},
          city = ${h.city || null},
          country = ${h.country || null},
          venue = ${h.location || null},
          theme = ${h.theme || null},
          prize_pool = ${h.prizePool || null},
          tracks = ${tracks}::jsonb,
          organizers = ${organizers}::jsonb,
          host_organizer = ${h.organizerName || null},
          is_published = true,
          updated_at = NOW()
        WHERE feishu_id = ${h.id}
      `;
      upserted++;
    } else {
      const baseSlug = generateSlug(h.shortName || h.name);
      let slug = baseSlug;
      let attempt = 0;
      while (true) {
        const dup = await sql`SELECT id FROM hackathon WHERE slug = ${slug} LIMIT 1`;
        if (dup.length === 0) break;
        slug = `${baseSlug}-${++attempt}`;
      }

      const id = crypto.randomUUID();
      await sql`
        INSERT INTO hackathon (
          id, feishu_id, slug, name, short_name, description, summary,
          website, source_url, start_date, end_date, registration_deadline,
          mode, location, city, country, venue, theme, prize_pool,
          tracks, organizers, host_organizer,
          status, is_verified, is_featured, is_published, created_at
        ) VALUES (
          ${id}, ${h.id}, ${slug}, ${h.name}, ${h.shortName || null},
          ${h.summary || null}, ${h.summary || null},
          ${h.website || h.sourceUrl || null}, ${h.sourceUrl || h.website || null},
          ${h.startDate || null}, ${h.endDate || null}, ${h.registrationDeadline || null},
          ${mode}, ${location || null}, ${h.city || null}, ${h.country || null},
          ${h.location || null}, ${h.theme || null}, ${h.prizePool || null},
          ${tracks}::jsonb, ${organizers}::jsonb, ${h.organizerName || null},
          'upcoming', false, false, true, NOW()
        )
      `;
      created++;
    }
  }

  // 下架：Neon 里有 feishu_id 但不在本次网站上线集合中的 → isPublished=false
  const publishedIds = websiteRows.map(h => h.id).filter(Boolean);
  if (allFeishuIds.length > 0) {
    const result = await sql`
      UPDATE hackathon SET is_published = false, updated_at = NOW()
      WHERE feishu_id IS NOT NULL
        AND feishu_id != ALL(${publishedIds})
        AND is_published = true
      RETURNING feishu_id, name
    `;
    if (result.length > 0) {
      console.log(`   📴 下架 ${result.length} 条: ${result.map(r => r.name).join(', ')}`);
    }
  }

  console.log(`   ✅ Neon: 新增 ${created} 条，更新 ${upserted} 条`);
}

// ── 本地文件生成 ────────────────────────────────────────

function generateLocalFiles(rows: HackathonRow[]) {
  console.log('\n📝 生成本地数据文件...');

  const today = new Date().toISOString().split('T')[0];
  const jsData = rows.map(h => ({
    name: h.name,
    shortName: h.shortName,
    startDate: h.startDate,
    endDate: h.endDate,
    city: h.city,
    country: h.country,
    mode: h.mode,
    modeText: { offline: '线下', online: '线上', hybrid: '混合' }[h.mode] || h.mode,
    theme: h.theme,
    tracks: h.tracks,
    techStack: h.techStack,
    tags: h.tags,
    prizePool: h.prizePool,
    website: h.website,
    summary: h.summary,
    location: h.location,
    registrationDeadline: h.registrationDeadline || null,
    isPast: h.endDate < today,
    isPublished: true,
    organizerName: h.organizerName,
    id: h.id,
  }));

  if (DRY_RUN) {
    console.log(`   [dry-run] 会生成 ${jsData.length} 条到 hackathons.js + seedHackathons/data.js`);
    return;
  }

  const header = `// 本地降级数据：云开发未配置或调用失败时使用。\n// 由 scripts/sync-from-feishu.ts 自动生成，请勿手动修改\nmodule.exports = `;
  const content = header + JSON.stringify(jsData, null, 2) + ';\n';

  const hackathonsPath = path.join(MINIPROGRAM_DIR, 'miniprogram/data/hackathons.js');
  const seedDataPath = path.join(MINIPROGRAM_DIR, 'cloudfunctions/seedHackathons/data.js');

  writeFileSync(hackathonsPath, content);
  writeFileSync(seedDataPath, content);

  console.log(`   ✅ 生成 ${jsData.length} 条 → hackathons.js + seedHackathons/data.js`);
}

// ── Cloud DB 写入 ───────────────────────────────────────

function postAutomator(body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 9420,
      path: '/api',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 10000,
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

async function syncToCloudDB(rows: HackathonRow[]) {
  console.log('\n☁️  同步到微信云 DB...');

  if (DRY_RUN) {
    console.log(`   [dry-run] 会同步 ${rows.length} 条到云 DB hackathons 集合`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  let successCount = 0;

  for (const h of rows) {
    const record = {
      id: h.id, name: h.name, shortName: h.shortName,
      startDate: h.startDate, endDate: h.endDate,
      city: h.city, country: h.country, location: h.location,
      mode: h.mode,
      modeText: ({ offline: '线下', online: '线上', hybrid: '混合' } as Record<string, string>)[h.mode] || h.mode,
      theme: h.theme, summary: h.summary, prizePool: h.prizePool,
      tracks: h.tracks, techStack: h.techStack, tags: h.tags,
      website: h.website,
      registrationDeadline: h.registrationDeadline || '',
      organizerName: h.organizerName,
      isPast: h.endDate < today, isPublished: true, updatedAt: Date.now(),
    };

    const recordJson = JSON.stringify(record);
    const expr = `(async function() {
      const db = wx.cloud.database();
      const data = ${recordJson};
      const exist = await db.collection('hackathons').where({ id: data.id }).limit(1).get();
      if (exist.data && exist.data.length > 0) {
        await db.collection('hackathons').doc(exist.data[0]._id).update({ data });
        return 'updated';
      } else {
        await db.collection('hackathons').add({ data });
        return 'created';
      }
    })()`;

    try {
      const res = await postAutomator({ method: 'evaluate', params: { expression: expr } });
      if (res?.result) successCount++;
    } catch {
      if (successCount === 0) break;
    }
  }

  if (successCount > 0) {
    console.log(`   ✅ 云 DB: ${successCount}/${rows.length} 条已同步`);
  } else {
    console.log('   ⚠️  微信开发者工具未连接，跳过云 DB 直接写入');
    console.log('   💡 请在微信开发者工具中部署 seedHackathons 云函数以同步小程序数据');
  }
}

// ── 主流程 ──────────────────────────────────────────────

async function main() {
  console.log(`🔄 飞书 → 双平台发布同步${DRY_RUN ? ' [预览模式]' : ''}\n${'─'.repeat(48)}`);

  const records = readFeishuTable();
  let rows = records.map(recordToHackathon).filter(h => h.name);

  if (SINGLE_ID) {
    rows = rows.filter(h => h.id === SINGLE_ID);
    if (rows.length === 0) {
      console.log(`❌ 未找到赛事ID: ${SINGLE_ID}`);
      process.exit(1);
    }
    console.log(`\n🎯 单条同步: ${rows[0].name}`);
  }

  const allFeishuIds = rows.map(h => h.id).filter(Boolean);
  const websiteRows = rows.filter(h => h.isPublished && h.targetPlatforms.includes('网站'));
  const miniprogramRows = rows.filter(h => h.isPublished && h.targetPlatforms.includes('小程序'));

  console.log(`\n📊 汇总:`);
  console.log(`   总记录: ${rows.length} 条`);
  console.log(`   上线网站: ${websiteRows.length} 条`);
  console.log(`   上线小程序: ${miniprogramRows.length} 条`);
  console.log(`   未上线: ${rows.filter(h => !h.isPublished).length} 条`);

  // 1. 同步网站（Neon hackathon 表）
  await syncToNeon(rows, allFeishuIds);

  // 2. 生成本地文件 + 同步云 DB（小程序）
  if (miniprogramRows.length > 0) {
    generateLocalFiles(miniprogramRows);
    await syncToCloudDB(miniprogramRows);
  } else {
    console.log('\n📝 无小程序上线记录，跳过本地文件生成');
  }

  console.log(`\n${'─'.repeat(48)}`);
  console.log('✅ 同步完成！');
}

main().catch(err => {
  console.error('❌ 同步失败:', err.message);
  process.exit(1);
});
