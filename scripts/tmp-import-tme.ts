/**
 * 一次性导入：TME AI Builder 大赛（https://ideas.qq.com/detail/ai-hackathon）
 * 测试完整链路：normalize → draft_hackathon → 上架完整度门槛 → 发布到 hackathon
 * 信息来源：页面文字 + 详情图片多模态识别（与 import-url 的图片识别流程等价）
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { normalizeToDraftInsert } from '../lib/normalize-hackathon';

const { draftHackathons, hackathons } = schema;
const SOURCE_URL = 'https://ideas.qq.com/detail/ai-hackathon';

// ── 提取结果（页面文字 + 6 张详情图识别）──
const extracted = {
  name: 'TME AI Builder 大赛',
  shortName: 'TME AI Builder',
  country: '中国',
  dateRange: '2026年6月10日-7月15日',
  startDate: '2026-06-10',
  endDate: '2026-07-15',
  format: 'hybrid', // 线上提交+线上评审，决赛同台路演
  theme: 'AI×音乐',
  summary:
    '腾讯音乐娱乐集团面向全员开放的 No Code AI 创意大赛：从 Prompt 到 Product，用 AI 定义音乐与音频未来，一个好想法 + AI 工具 = 一个可交互的产品。',
  prizePool: '¥27,500',
  teams: '不限，在线报名并组建团队',
  tracks: [
    { title: 'A. 创新音乐产品', description: '从 0 到 1 自由创意：任意想法、任何产品、形态不限，只要是全新的，创意需要服务于音乐或长音频场景' },
    { title: 'B. TME 产品创新功能', description: '在现有产品上做创意：选一个熟悉的腾讯音乐平台产品（QQ音乐/酷狗/酷我/全民K歌/JOOX/Wesing/酷狗直播/喜马拉雅/懒人听书等），找到它的问题或空白，把创意嵌进去' },
  ],
  agenda: [
    { title: '投稿阶段', time: '6月10日-6月25日', detail: '在线提交报名信息并组建团队' },
    { title: '初赛评审', time: '6月26日-7月2日', detail: '专家评审团进行线上评审' },
    { title: '入围公布', time: '7月3日', detail: '公布决赛入围名单，同步评审反馈意见' },
    { title: '决赛路演', time: '7月15日', detail: '入围团队同台路演+答辩，评出最终名次' },
    { title: '颁奖与公布', time: '日期待定', detail: '腾讯音乐产品设计周颁奖。奖金：一等奖¥10,000×1、二等奖¥5,000×2、三等奖¥2,000×3、人气奖¥500×3；高校学生获奖直通 TME 实习面试' },
  ],
  organizers: [
    { name: '腾讯音乐娱乐集团', url: 'https://www.tencentmusic.com/' },
    { name: 'TME产品通道' },
    { name: 'TME设计通道' },
    { name: 'TME音乐学堂' },
  ],
  // 页面「主办单位」区块英文标注即 SPONSOR
  sponsors: [
    { name: '腾讯音乐娱乐集团', url: 'https://www.tencentmusic.com/', logo: 'https://ideas.qq.com/static/media/logo.2b7702d7b57a87819ccb3d18fa53f936.svg' },
  ],
};

// ── 与 app/api/drafts/publish/route.ts 一致的门槛校验 ──
function validateQuality(d: { theme?: string | null; tracks?: unknown; sourceUrl?: string | null }): string[] {
  const missing: string[] = [];
  if (!d.theme?.trim()) missing.push('主题（theme）');
  if (!Array.isArray(d.tracks) || d.tracks.length === 0) missing.push('至少一个赛道（tracks）');
  if (!d.sourceUrl?.trim()) missing.push('报名/官网链接');
  return missing;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // 查重
  const dup = await db.select({ id: draftHackathons.id }).from(draftHackathons)
    .where(eq(draftHackathons.sourceUrl, SOURCE_URL)).limit(1);
  if (dup.length > 0) { console.log('⚠️ 该 URL 已导入过，draftId =', dup[0].id); return; }

  // 1. normalize（生产同款，含 sanitizeSponsors/Organizers）
  const normalized = normalizeToDraftInsert(extracted, { url: SOURCE_URL, platform: 'tencent-ideas', confidence: 92 });
  console.log('── normalize 结果 ──');
  console.log(JSON.stringify({ ...normalized, rawData: '(omitted)' }, null, 2));

  // 2. 入草稿箱
  const [draft] = await db.insert(draftHackathons).values(normalized).returning();
  console.log(`\n✅ 已入草稿箱 draftId=${draft.id} confidence=${draft.confidence}`);

  // 3. 上架门槛校验（与 publish route 同逻辑）
  const missing = validateQuality(draft);
  if (!draft.name || !draft.startDate || !draft.endDate) missing.unshift('名称/起止日期');
  if (missing.length > 0) { console.log('❌ 门槛未通过，缺：', missing.join('、')); return; }
  console.log('✅ 上架完整度门槛通过（theme + tracks + 有效报名链接）');

  // 4. 发布（与 publish route 同映射）
  const baseSlug = generateSlug(draft.shortName || draft.name!);
  let slug = baseSlug; let attempt = 0;
  while ((await db.select({ id: hackathons.id }).from(hackathons).where(eq(hackathons.slug, slug)).limit(1)).length > 0) {
    slug = `${baseSlug}-${++attempt}`;
  }
  const location = [draft.city, draft.venue].filter(Boolean).join(' · ');
  const hostOrganizer = Array.isArray(draft.organizers) && draft.organizers.length > 0
    ? (draft.organizers as { name: string }[])[0].name : undefined;

  const [hk] = await db.insert(hackathons).values({
    name: draft.name!, slug, shortName: draft.shortName,
    description: draft.summary, summary: draft.summary,
    website: draft.sourceUrl, sourceUrl: draft.sourceUrl,
    startDate: draft.startDate!, endDate: draft.endDate!,
    mode: (draft.format as 'offline' | 'online' | 'hybrid') || 'hybrid',
    location, city: draft.city, country: draft.country, venue: draft.venue,
    theme: draft.theme, prizePool: draft.prizePool, teams: draft.teams,
    tracks: draft.tracks, agenda: draft.agenda,
    organizers: draft.organizers, sponsors: draft.sponsors, hostOrganizer,
    status: 'upcoming', isVerified: false, isFeatured: false,
  }).returning();

  await db.update(draftHackathons)
    .set({ status: 'published', publishedHackathonId: hk.id, publishedAt: new Date() })
    .where(eq(draftHackathons.id, draft.id));

  console.log(`\n🚀 已发布上线：id=${hk.id}`);
  console.log(`   slug=${hk.slug}`);
  console.log(`   线上地址: https://hackertrip.space/hackathon/${hk.slug}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
