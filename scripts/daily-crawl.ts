/**
 * 每日黑客松爬取脚本（本地 cron / launchd 执行）
 *
 * 流程：
 *   1. ensureTargets() 幂等插入数据源到 scrape_target 表
 *   2. 读取 enabled & schedule='daily' 的目标
 *   3. 每个目标：Firecrawl 抓 markdown（jina 降级）→ DeepSeek 提取赛事数组
 *   4. 按 name 去重（查 hackathons + draft_hackathon + 飞书赛事总表）
 *   5. 新赛事写入 draft_hackathon + 飞书「爬虫采集」子表
 *   6. 写 scrape_log，更新 target 统计
 *
 * 运行：source .env.local 后 `npx tsx scripts/daily-crawl.ts`
 *      （launchd 通过 wrapper sh 注入环境变量）
 */

import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, ilike } from 'drizzle-orm';
import FirecrawlApp from '@mendable/firecrawl-js';
import * as schema from '../lib/db/schema';
import { sanitizeOrganizers, sanitizeSponsors, parseDateRange } from '../lib/normalize-hackathon';
import { isEndedHackathon } from '../lib/hackathon-gate';
import { batchCreateRecords, sendReviewMessage } from './lib/feishu-cli';
import { hackathonOpsConfig } from './lib/hackathon-ops-config';
import {
  buildReviewMessage,
  createReviewCandidate,
  ReviewCandidate,
  writeRuntimeArtifact,
} from './lib/hackathon-ops-core';

const { scrapeTargets, scrapeLogs, draftHackathons, hackathons } = schema;

// ───────────────────────── 配置 ─────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

/** 用户选定的中国黑客松数据源（幂等 seed，可后续在 DB 增减） */
const DEFAULT_TARGETS = [
  {
    name: 'Hackathon Navigator',
    url: 'https://hackathon-navigator.vercel.app/',
    platform: 'navigator',
    schedule: 'daily',
  },
  {
    name: 'CompeteHub',
    url: 'https://www.competehub.dev/en?category=5',
    platform: 'competehub',
    schedule: 'daily',
  },
  {
    name: '腾讯云开发者大赛',
    url: 'https://tch.cloud.tencent.com/',
    platform: 'tencent',
    schedule: 'daily',
  },
];

interface ExtractedHackathon {
  name: string;
  dateRange?: string;
  city?: string;
  country?: string;
  venue?: string;
  prizePool?: string;
  teams?: string;
  format?: string;
  theme?: string;
  summary?: string;
  detailUrl?: string;
  registrationDeadline?: string;
  tracks?: { title: string; description?: string }[];
  organizers?: { name: string; url?: string; logo?: string }[];
  sponsors?: { name: string; url?: string; logo?: string; tier?: string }[];
}

// ───────────────────────── 工具 ─────────────────────────

/** 读取 Firecrawl CLI 凭据（与 jina-llm-scraper 一致） */
function getFirecrawlKey(): string | null {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  try {
    const credPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'firecrawl-cli',
      'credentials.json',
    );
    return JSON.parse(fs.readFileSync(credPath, 'utf-8')).apiKey || null;
  } catch {
    return null;
  }
}

/** 抓取页面 markdown：Firecrawl 优先，Jina Reader 降级 */
async function fetchMarkdown(url: string): Promise<string> {
  const key = getFirecrawlKey();
  if (key) {
    try {
      const fc = new FirecrawlApp({ apiKey: key });
      const res = await fc.scrape(url, { formats: ['markdown'] });
      if (res.markdown && res.markdown.length > 100) return res.markdown;
    } catch (e) {
      console.warn(`  [fetch] Firecrawl 失败，降级 Jina: ${(e as Error).message}`);
    }
  }
  // 降级：Jina Reader（免费）
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/markdown', 'X-Return-Format': 'markdown' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** DeepSeek 从 markdown 提取黑客松赛事数组（列表页可能含多个） */
async function extractHackathons(markdown: string): Promise<ExtractedHackathon[]> {
  if (!DEEPSEEK_API_KEY) throw new Error('未配置 DEEPSEEK_API_KEY');

  const prompt = `你是黑客松信息提取器。从下面的网页内容中提取**所有**黑客松/编程马拉松/技术竞赛赛事。
页面可能是列表/导航页（含多个赛事）或单个活动页（1 个赛事）。

只输出 JSON 对象，格式：
{"hackathons": [
  {
    "name": "赛事全称",
    "dateRange": "日期范围，如 2026年3月15日-17日",
    "city": "城市名（只填城市，不要省份）",
    "country": "国家，默认 中国",
    "venue": "具体场地",
    "prizePool": "奖金池，如 ¥100,000",
    "teams": "参赛规模",
    "format": "offline / online / hybrid",
    "theme": "主题标签，如 AI、Web3",
    "summary": "一句话简介（50字内）",
    "detailUrl": "该赛事详情页链接（如页面中有）",
    "registrationDeadline": "报名截止日期，YYYY-MM-DD（如页面中有）",
    "tracks": [{"title":"赛道名","description":"描述"}],
    "organizers": [{"name":"主办方","url":"主办方官网链接（如有）"}],
    "sponsors": [{"name":"赞助商名称","url":"赞助商官网链接（如有）","logo":"logo图片完整URL（如页面中有）","tier":"赞助级别 platinum/gold/silver/bronze（页面明确标注时才填）"}]
  }
]}

规则：
- 只提取真正的黑客松/赛事，忽略导航、广告、页脚等无关内容
- sponsors 只提取明确标注为赞助商/合作伙伴/支持方的公司，logo 必须是页面中真实存在的图片 URL，不要猜测
- 找不到的字段用空字符串或空数组，不要编造
- 已结束很久的往届赛事可以跳过，优先未来/进行中的
- 最多返回 20 个最相关（未来/近期）的赛事，避免输出过长
- 如果页面里没有任何赛事，返回 {"hackathons": []}
- 只返回 JSON，不要任何解释`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: `${prompt}\n\n---\n网页内容：\n\n${markdown.slice(0, 20000)}` },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '{}';
  const list = parseHackathonArray(text);
  return list.filter((h) => h && h.name && h.name.trim().length > 1);
}

/** 健壮解析：正常 parse 失败时（输出被截断）尽量截取到最后一个完整对象 */
function parseHackathonArray(text: string): ExtractedHackathon[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.hackathons)) return parsed.hackathons;
  } catch {
    const arrStart = text.indexOf('[');
    const lastBrace = text.lastIndexOf('}');
    if (arrStart >= 0 && lastBrace > arrStart) {
      try {
        const repaired = text.slice(arrStart, lastBrace + 1) + ']';
        const arr = JSON.parse(repaired);
        if (Array.isArray(arr)) {
          console.warn('  [parse] JSON 被截断，已恢复部分赛事');
          return arr;
        }
      } catch {
        /* 放弃 */
      }
    }
  }
  return [];
}

// ───────────────────────── 飞书爬虫采集表 ─────────────────

function writeToFeishuCrawlerTable(items: ReviewCandidate[]) {
  if (items.length === 0) return;
  const normalizeMode = (value?: string): string | null => {
    const mode = (value || '').trim().toLowerCase();
    if (!mode) return null;
    if (mode.includes('hybrid') || mode.includes('混合') || (mode.includes('online') && mode.includes('offline'))) return '混合';
    if (mode.includes('online') || mode.includes('线上') || mode.includes('virtual')) return '线上';
    if (mode.includes('offline') || mode.includes('线下') || mode.includes('in-person') || mode.includes('in person')) return '线下';
    return null;
  };
  const fields = [
    '候选ID', '赛事名称', '简称', '城市', '国家', '场地', '形式', '主题', '简介',
    '开始日期', '结束日期', '报名截止', '奖金池', '参赛规模', '赛道', '主办方',
    '官网', '来源链接', '来源平台', '置信度', '置信等级', '置信依据',
    '缺失字段', '去重键', '运行批次', '审核状态', '上线平台', '采集时间',
  ];
  const rows = items.map(h => {
    const trackStr = (h.tracks || []).map(t => t.title).join(' / ');
    const orgStr = (h.organizers || []).map(o => o.name).join(' / ');
    const mode = normalizeMode(h.format);
    return [
      h.candidateId,
      h.name,
      h.shortName || null,
      h.city || null,
      h.country || '中国',
      h.venue || null,
      mode || null,
      h.theme || null,
      h.summary || null,
      h.startDate ? `${h.startDate} 00:00:00` : null,
      h.endDate ? `${h.endDate} 00:00:00` : null,
      h.registrationDeadline ? `${h.registrationDeadline} 00:00:00` : null,
      h.prizePool || null,
      h.teams || null,
      trackStr || null,
      orgStr || null,
      h.website || h.sourceUrl,
      h.sourceUrl,
      h.platform || null,
      h.confidence,
      h.confidenceLevel,
      h.confidenceReasons.join('；'),
      h.missingFields.join('、') || null,
      h.dedupeKey,
      h.batchDate,
      h.reviewStatus,
      ['网站', '小程序'],
      `${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    ];
  });
  batchCreateRecords(hackathonOpsConfig.eventBaseToken, hackathonOpsConfig.crawlerTableId, fields, rows);
  console.log(`  📋 写入飞书「爬虫采集」${items.length} 条`);
}

function flushPendingOutbox() {
  if (!fs.existsSync(hackathonOpsConfig.runtimeDir)) return;
  for (const batchDate of fs.readdirSync(hackathonOpsConfig.runtimeDir).sort()) {
    const dir = path.join(hackathonOpsConfig.runtimeDir, batchDate);
    const candidatesFile = path.join(dir, 'candidates.json');
    const queuedMarker = path.join(dir, 'feishu-queued.ok');
    const notifiedMarker = path.join(dir, 'feishu-notified.ok');
    if (!fs.existsSync(candidatesFile)) continue;
    const candidates = JSON.parse(fs.readFileSync(candidatesFile, 'utf8')) as ReviewCandidate[];
    if (candidates.length > 0 && !fs.existsSync(queuedMarker)) {
      writeToFeishuCrawlerTable(candidates);
      fs.writeFileSync(queuedMarker, new Date().toISOString(), 'utf8');
    }
    if (candidates.length > 0 && hackathonOpsConfig.reviewChatId && !fs.existsSync(notifiedMarker)) {
      sendReviewMessage(buildReviewMessage(candidates, batchDate, {
        openId: hackathonOpsConfig.reviewLeadOpenId,
        name: hackathonOpsConfig.reviewLeadName,
        role: hackathonOpsConfig.reviewLeadRole,
      }), `hackertrip-crawl-${batchDate}`);
      fs.writeFileSync(notifiedMarker, new Date().toISOString(), 'utf8');
    }
  }
}

// ───────────────────────── 主流程 ─────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('未配置 DATABASE_URL');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const batchDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`\n🕷️  每日黑客松爬取 — 批次 ${batchDate}\n${'─'.repeat(48)}`);

  if (process.argv.includes('--flush-outbox')) {
    flushPendingOutbox();
    console.log('飞书待发送批次处理完成');
    return;
  }
  try {
    flushPendingOutbox();
  } catch (error) {
    console.warn(`  ⚠️ 历史飞书待发送批次重试失败: ${(error as Error).message}`);
  }

  // 1. 幂等确保数据源存在
  for (const t of DEFAULT_TARGETS) {
    const exists = await db
      .select({ id: scrapeTargets.id })
      .from(scrapeTargets)
      .where(eq(scrapeTargets.url, t.url));
    if (exists.length === 0) {
      await db.insert(scrapeTargets).values({ ...t, enabled: true });
      console.log(`  ＋ 新增数据源: ${t.name}`);
    }
  }

  // 2. 读取启用的每日目标
  const targets = await db
    .select()
    .from(scrapeTargets)
    .where(and(eq(scrapeTargets.enabled, true), eq(scrapeTargets.schedule, 'daily')));

  console.log(`  共 ${targets.length} 个启用的每日数据源\n`);

  let totalFound = 0;
  let totalSaved = 0;
  let totalDup = 0;
  let totalEnded = 0;
  const reviewCandidates: ReviewCandidate[] = [];

  for (const target of targets) {
    const startedAt = Date.now();
    const [log] = await db
      .insert(scrapeLogs)
      .values({ targetId: target.id, url: target.url, platform: target.platform, status: 'pending' })
      .returning();

    try {
      console.log(`▶ ${target.name}  (${target.url})`);
      const md = await fetchMarkdown(target.url);
      const list = await extractHackathons(md);
      console.log(`  提取到 ${list.length} 个赛事`);

      let saved = 0;
      let dup = 0;
      let skippedEnded = 0;
      for (const h of list) {
        const name = h.name.trim();

        // 源头拦截：已结束/往届赛事不进草稿箱
        if (isEndedHackathon({ name, dateRange: h.dateRange })) {
          skippedEnded++;
          continue;
        }

        // 去重：已发布表 或 草稿箱 已有同名
        const inHackathons = await db
          .select({ id: hackathons.id })
          .from(hackathons)
          .where(ilike(hackathons.name, name))
          .limit(1);
        const inDrafts = await db
          .select({ id: draftHackathons.id })
          .from(draftHackathons)
          .where(ilike(draftHackathons.name, name))
          .limit(1);

        if (inHackathons.length > 0 || inDrafts.length > 0) {
          dup++;
          continue;
        }

        // 解析日期，入库即带 start/end（供详情页与已结束判断用）
        const { start, end } = parseDateRange(h.dateRange || '');
        const sourceUrl = h.detailUrl || target.url;
        const candidate = createReviewCandidate({
          name,
          city: h.city,
          country: h.country || '中国',
          venue: h.venue,
          startDate: start ? start.toISOString().split('T')[0] : undefined,
          endDate: end ? end.toISOString().split('T')[0] : undefined,
          registrationDeadline: h.registrationDeadline,
          format: h.format,
          theme: h.theme,
          summary: h.summary,
          prizePool: h.prizePool,
          teams: h.teams,
          tracks: h.tracks,
          organizers: h.organizers,
          sponsors: h.sponsors?.map(item => ({ name: item.name })),
          website: h.detailUrl,
          sourceUrl,
          platform: target.platform,
          batchDate,
        });

        await db.insert(draftHackathons).values({
          sourceUrl,
          platform: target.platform,
          scrapeLogId: log.id,
          name,
          city: h.city || null,
          country: h.country || '中国',
          venue: h.venue || null,
          dateRange: h.dateRange || null,
          startDate: start,
          endDate: end,
          format: h.format || null,
          theme: h.theme || null,
          summary: h.summary || null,
          prizePool: h.prizePool || null,
          teams: h.teams || null,
          tracks: h.tracks || [],
          organizers: sanitizeOrganizers(h.organizers),
          sponsors: sanitizeSponsors(h.sponsors),
          confidence: candidate.confidence,
          rawData: { ...h, candidateId: candidate.candidateId, batchDate, sourceTarget: target.name },
          status: 'pending',
        });
        saved++;
        reviewCandidates.push(candidate);
      }

      totalFound += list.length;
      totalSaved += saved;
      totalDup += dup;
      totalEnded += skippedEnded;
      const extras = skippedEnded ? `跳过已结束 ${skippedEnded} 条` : '';
      console.log(`  ✅ 新增 ${saved} 条入草稿箱，去重跳过 ${dup} 条${extras ? '，' + extras : ''}\n`);

      await db
        .update(scrapeLogs)
        .set({
          status: 'success',
          itemsFound: list.length,
          itemsSaved: saved,
          duration: Date.now() - startedAt,
          metadata: { batchDate, duplicates: dup },
        })
        .where(eq(scrapeLogs.id, log.id));
      await db
        .update(scrapeTargets)
        .set({
          lastScrapedAt: new Date(),
          lastStatus: 'success',
          successCount: (target.successCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(scrapeTargets.id, target.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ 失败: ${msg}\n`);
      await db
        .update(scrapeLogs)
        .set({ status: 'error', errorMessage: msg, duration: Date.now() - startedAt })
        .where(eq(scrapeLogs.id, log.id));
      await db
        .update(scrapeTargets)
        .set({
          lastScrapedAt: new Date(),
          lastStatus: 'error',
          errorCount: (target.errorCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(scrapeTargets.id, target.id));
    }
  }

  const candidatesPath = writeRuntimeArtifact(batchDate, 'candidates.json', JSON.stringify(reviewCandidates, null, 2));
  const reviewMessage = buildReviewMessage(reviewCandidates, batchDate, {
    openId: hackathonOpsConfig.reviewLeadOpenId,
    name: hackathonOpsConfig.reviewLeadName,
    role: hackathonOpsConfig.reviewLeadRole,
  });
  const messagePath = writeRuntimeArtifact(batchDate, 'feishu-review.md', reviewMessage);
  const batchDir = path.dirname(candidatesPath);

  if (reviewCandidates.length > 0) {
    try {
      writeToFeishuCrawlerTable(reviewCandidates);
      fs.writeFileSync(path.join(batchDir, 'feishu-queued.ok'), new Date().toISOString(), 'utf8');
    } catch (error) {
      console.warn(`  ⚠️ 飞书审核队列写入失败，明日会自动重试: ${(error as Error).message}`);
    }
  }

  if (reviewCandidates.length > 0 && hackathonOpsConfig.reviewChatId) {
    try {
      sendReviewMessage(reviewMessage, `hackertrip-crawl-${batchDate}`);
      fs.writeFileSync(path.join(batchDir, 'feishu-notified.ok'), new Date().toISOString(), 'utf8');
      console.log('  💬 已推送飞书审核群');
    } catch (error) {
      console.warn(`  ⚠️ 飞书群推送失败: ${(error as Error).message}`);
    }
  } else if (!hackathonOpsConfig.reviewChatId) {
    console.warn('  ⚠️ 未配置 FEISHU_REVIEW_CHAT_ID，已生成群消息草稿但未发送');
  }

  console.log(`${'─'.repeat(48)}`);
  console.log(`🏁 批次 ${batchDate} 完成：发现 ${totalFound}，新增 ${totalSaved}，去重 ${totalDup}，跳过已结束 ${totalEnded}`);
  console.log(`   本地产物: ${candidatesPath}`);
  console.log(`   群消息草稿: ${messagePath}`);
  console.log('   去飞书「爬虫采集」审核；通过后由 npm run sync:approved 自动上架\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('致命错误:', e);
    process.exit(1);
  });
