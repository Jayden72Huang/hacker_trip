/**
 * 一次性清理：删除草稿箱里已结束的赛事 + 把高质量未结束草稿自动发布。
 * 已结束判断与 daily-crawl 源头拦截同源（lib/hackathon-gate），删除后不会被次日爬虫重新爬入（源头同样拦截）。
 *
 * 运行：npx tsx scripts/cleanup-ended-drafts.ts          （演练，只打印不改库）
 *      npx tsx scripts/cleanup-ended-drafts.ts --apply   （真正执行）
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { isEndedHackathon, qualifiesForAutoPublish } from '../lib/hackathon-gate';
import { publishDraftRow } from '../lib/publish-draft';

const { draftHackathons } = schema;
const APPLY = process.argv.includes('--apply');

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const rows = await db.select().from(draftHackathons).where(eq(draftHackathons.status, 'pending'));
  console.log(`待审 pending: ${rows.length} 条　模式: ${APPLY ? '执行 --apply' : '演练（加 --apply 真正执行）'}\n`);

  const ended = rows.filter((r) => isEndedHackathon({ name: r.name, endDate: r.endDate, dateRange: r.dateRange }));
  const alive = rows.filter((r) => !ended.includes(r));

  console.log(`── 已结束（将删除）: ${ended.length} 条 ──`);
  ended.forEach((r) => console.log(`  ✗ ${r.name}  |  ${r.dateRange || '(无日期)'}`));

  // 自动发布候选：未结束 + conf>90 + 链接验证（verifyRegistrationLink 会发网络请求）
  const autoPubCandidates = alive.filter((r) => (r.confidence ?? 0) > 90);
  console.log(`\n── 自动发布候选（未结束且 conf>90，逐条验证报名链接）: ${autoPubCandidates.length} 条 ──`);

  let deleted = 0;
  let published = 0;

  if (APPLY) {
    for (const r of ended) {
      await db.delete(draftHackathons).where(eq(draftHackathons.id, r.id));
      deleted++;
    }
  }

  for (const r of autoPubCandidates) {
    const ok = qualifiesForAutoPublish(r);
    console.log(`  ${ok ? '✓ 通过' : '✗ 未过'}  ${r.name}  (conf=${r.confidence})`);
    if (ok && APPLY && r.startDate && r.endDate) {
      const pub = await publishDraftRow(db, r);
      published++;
      console.log(`      🚀 已发布 → /hackathon/${pub.slug}`);
    }
  }

  console.log(`\n🏁 ${APPLY ? '已执行' : '演练预计'}：删除已结束 ${APPLY ? deleted : ended.length} 条，自动发布 ${APPLY ? published : '(需验证)'} 条`);
  console.log(`   清理后剩余待审约 ${rows.length - ended.length - published} 条`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
