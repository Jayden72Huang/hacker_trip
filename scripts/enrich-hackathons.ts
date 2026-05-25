/**
 * 补全黑客松信息：将从官网/搜索抓取到的完整数据更新入库
 * 运行: npx tsx scripts/enrich-hackathons.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hackathons } from '../lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL!));
const SOURCE = 'https://hackathon-navigator.vercel.app/';

interface Enrichment {
  slug: string;
  prizePool?: string;
  organizer?: string;
  description?: string;
  website?: string;
  startDate?: Date;
  endDate?: Date;
  registrationDeadline?: Date;
  mode?: 'online' | 'offline' | 'hybrid';
  participantCount?: number;
  tracks?: Array<{ title: string; description: string }>;
  tags?: string[];
}

const enrichments: Enrichment[] = [
  // ===== 腾讯云黑客松 =====
  {
    slug: 'hn-腾讯云黑客松-游戏开发挑战赛',
    prizePool: '¥100万',
    organizer: '腾讯云',
    description: 'AI CAN DO IT — 腾讯云黑客松游戏开发挑战赛，总奖金池100万元。分线上公开挑战赛和线下极限黑客松两阶段，面向游戏开发领域的AI创新。',
    website: 'https://tch.cloud.tencent.com/contest/40',
    startDate: new Date(2026, 3, 17),
    endDate: new Date(2026, 8, 1),
    registrationDeadline: new Date(2026, 5, 30),
    mode: 'hybrid',
    participantCount: 650,
  },
  {
    slug: 'hn-腾讯云黑客松-华东赛区',
    prizePool: '¥100万（总）',
    organizer: '腾讯云',
    description: '腾讯云黑客松游戏开发挑战赛华东赛区，上海站线下路演。总奖金池100万元的分赛区。',
    website: 'https://tch.cloud.tencent.com/',
    mode: 'offline',
  },
  {
    slug: 'hn-腾讯云黑客松-华北赛区',
    prizePool: '¥100万（总）',
    organizer: '腾讯云',
    description: '腾讯云黑客松游戏开发挑战赛华北赛区，北京站线下路演。总奖金池100万元的分赛区。',
    website: 'https://tch.cloud.tencent.com/',
    mode: 'offline',
  },
  {
    slug: 'hn-腾讯云黑客松-华中赛区',
    prizePool: '¥100万（总）',
    organizer: '腾讯云',
    description: '腾讯云黑客松游戏开发挑战赛华中赛区，武汉站线下路演。总奖金池100万元的分赛区。',
    website: 'https://tch.cloud.tencent.com/',
    mode: 'offline',
  },
  {
    slug: 'hn-腾讯云黑客松-总决赛',
    prizePool: '¥100万（总）',
    organizer: '腾讯云',
    description: '腾讯云黑客松游戏开发挑战赛总决赛，深圳腾讯全球数字生态大会期间举行。总奖金池100万元。',
    website: 'https://tch.cloud.tencent.com/',
    mode: 'offline',
  },
  {
    slug: 'hn-腾讯云黑客松-港澳赛区',
    prizePool: '¥100万（总）',
    organizer: '腾讯云',
    description: '腾讯云黑客松游戏开发挑战赛港澳赛区，港澳地区线下路演。总奖金池100万元的分赛区。',
    website: 'https://tch.cloud.tencent.com/',
    mode: 'offline',
  },

  // ===== 抖音AI创变者 =====
  {
    slug: 'hn-抖音ai创变者计划-黑客松联赛',
    prizePool: '¥100万+',
    organizer: '抖音 / 字节跳动',
    description: '抖音AI创变者计划 2026，高校生专属大型AI黑客松。4大赛道（互动空间/内容重构/刷到懂你/视觉搜索），初赛覆盖全国50+城市线下交流赛，总决赛含5天4夜AI嘉年华。优秀者获字节跳动面试快速通道。',
    website: 'https://aiia.douyin.com/',
    registrationDeadline: new Date(2026, 5, 20),
    startDate: new Date(2026, 3, 13),
    endDate: new Date(2026, 8, 30),
    mode: 'hybrid',
    tracks: [
      { title: '互动空间', description: 'Interactive Space 赛道' },
      { title: '内容重构', description: '抖音精选内容重构赛道' },
      { title: '刷到懂你的瞬间', description: '个性化推荐赛道' },
      { title: '视觉搜索', description: 'Visual Search 赛道' },
    ],
  },
  {
    slug: 'hn-抖音ai创变者-上海金山站',
    organizer: '抖音 / 字节跳动',
    description: '抖音AI创变者计划上海金山站，漕泾数字游民村，乡村振兴+AI内容创作黑客松。',
  },
  {
    slug: 'hn-抖音ai创变者-合肥模立方站',
    organizer: '抖音 / 字节跳动',
    description: '抖音AI创变者计划合肥站，模立方AI体验+视觉搜索赛道，140余名选手参赛。',
  },
  {
    slug: 'hn-抖音ai创变者-山东站',
    organizer: '抖音 / 字节跳动',
    description: '抖音AI创变者计划山东站，济南齐鲁软件园，互动空间赛道黑客松。',
  },

  // ===== Mantle =====
  {
    slug: 'hn-mantle-2026图灵测试黑客松',
    prizePool: '$120,000',
    organizer: 'Mantle Network',
    description: 'Mantle Turing Test Hackathon 2026，两阶段AI+区块链黑客松，$12万总奖池。Phase 2 "AI Awakening" 设6条赛道，由 Tencent Cloud、Bybit、ByReal、BGA 联合支持。713+开发者参赛。',
    website: 'https://dorahacks.io/hackathon/mantleturingtesthackathon2026/detail',
    startDate: new Date(2026, 4, 1),
    endDate: new Date(2026, 5, 15),
    registrationDeadline: new Date(2026, 5, 15),
    mode: 'online',
    participantCount: 713,
  },

  // ===== MindSpore =====
  {
    slug: 'hn-mindspore量子计算黑客松-第八届',
    prizePool: '实物奖品（华为Mate 80 Pro Max等）',
    organizer: 'CCF + 华为 MindSpore + 华大基因',
    description: '第八届 MindSpore Quantum 黑客松，量子计算编程挑战赛。设量子启发算法赛道和量子组合优化赛道，需使用 MindSpore Quantum 框架。三阶段赛制：热身赛→初赛→决赛答辩。',
    registrationDeadline: new Date(2026, 5, 21),
    startDate: new Date(2026, 3, 24),
    endDate: new Date(2026, 6, 12),
    mode: 'online',
    tracks: [
      { title: '量子启发算法赛道', description: '基因分相 Max-Cut 优化' },
      { title: '量子组合优化赛道', description: '量子算法挑战' },
    ],
  },

  // ===== 百度飞桨 =====
  {
    slug: 'hn-百度飞桨黑客马拉松-新一期',
    prizePool: '¥7万+（PaddleOCR赛道）',
    organizer: '百度飞桨 / 深度学习技术及应用国家工程研究中心',
    description: '第十期飞桨黑客松，面向全球开发者的深度学习编程活动。设7条赛道：开源贡献、Fundable Projects、护航计划集训营、PaddleOCR+ERNIE应用创新、文心合作伙伴、PaddleOCR全球衍生模型挑战赛。',
    website: 'https://github.com/PaddlePaddle/Paddle/issues/78292',
    startDate: new Date(2026, 2, 13),
    endDate: new Date(2026, 8, 30),
    mode: 'online',
    tracks: [
      { title: '开源贡献个人挑战赛', description: '春节特别季' },
      { title: 'Fundable Projects', description: '可资助项目赛道' },
      { title: '护航计划集训营', description: '提前批+正式批' },
      { title: 'PaddleOCR+ERNIE 应用创新赛道', description: 'OCR+大模型应用' },
      { title: '文心合作伙伴赛道', description: '海光DCU适配' },
      { title: 'PaddleOCR 全球衍生模型挑战赛', description: '¥7万奖金' },
    ],
  },

  // ===== 蚂蚁集团（待开放，信息有限）=====
  {
    slug: 'hn-蚂蚁集团-第十一届黑客松',
    organizer: '蚂蚁集团',
    description: '蚂蚁集团第十一届黑客松，527技术日配套活动。蚂蚁年度技术周的传统黑客松赛事，设内部+外部赛道。',
  },
];

async function enrich() {
  console.log('=== 开始补全黑客松信息 ===\n');

  let updated = 0;
  for (const e of enrichments) {
    const set: Record<string, any> = { updatedAt: sql`now()` };
    if (e.prizePool) set.prizePool = e.prizePool;
    if (e.organizer) set.organizer = e.organizer;
    if (e.description) set.description = e.description;
    if (e.website) set.website = e.website;
    if (e.startDate) set.startDate = e.startDate;
    if (e.endDate) set.endDate = e.endDate;
    if (e.registrationDeadline) set.registrationDeadline = e.registrationDeadline;
    if (e.mode) set.mode = e.mode;
    if (e.participantCount) set.participantCount = e.participantCount;
    if (e.tracks) set.tracks = e.tracks;
    if (e.tags) set.tags = e.tags;

    const result = await db
      .update(hackathons)
      .set(set)
      .where(eq(hackathons.slug, e.slug))
      .returning({ name: hackathons.name });

    if (result.length > 0) {
      const fields = [];
      if (e.prizePool) fields.push(`奖金=${e.prizePool}`);
      if (e.organizer) fields.push(`组织方=${e.organizer}`);
      if (e.website) fields.push('网站✓');
      if (e.registrationDeadline) fields.push('截止日✓');
      if (e.tracks) fields.push(`${e.tracks.length}条赛道`);
      if (e.participantCount) fields.push(`${e.participantCount}人`);
      console.log(`  ✅ ${result[0].name}: ${fields.join(', ')}`);
      updated++;
    } else {
      console.log(`  ⚠️ 未找到 slug=${e.slug}`);
    }
  }

  console.log(`\n更新了 ${updated} 条记录\n`);

  // 最终审计
  console.log('=== 最终审计：所有来源赛事 ===\n');
  const all = await db
    .select({
      name: hackathons.name,
      organizer: hackathons.organizer,
      prizePool: hackathons.prizePool,
      city: hackathons.city,
      status: hackathons.status,
      website: hackathons.website,
      registrationDeadline: hackathons.registrationDeadline,
      description: hackathons.description,
    })
    .from(hackathons)
    .where(eq(hackathons.sourceUrl, SOURCE));

  let ready = 0, notReady = 0;
  for (const r of all) {
    const hasOrg = !!r.organizer;
    const hasPrize = !!r.prizePool;
    const hasDesc = !!r.description && r.description.length > 10;
    const hasWebsite = !!r.website;
    const isComplete = hasOrg && hasDesc && hasWebsite;

    const status = r.status === 'ended' ? '已结束' : '报名中';
    const marker = isComplete ? '✅' : '❌';
    if (isComplete) ready++; else notReady++;

    console.log(
      `  ${marker} [${status}] ${r.name}\n` +
      `     组织方: ${r.organizer || '❌'} | 奖金: ${r.prizePool || '-'} | 网站: ${r.website ? '✓' : '❌'}`
    );
  }

  console.log(`\n可上线: ${ready}/${all.length} | 仍需补全: ${notReady}/${all.length}`);
}

enrich().catch(console.error);
