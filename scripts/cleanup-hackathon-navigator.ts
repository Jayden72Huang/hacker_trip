/**
 * 清理+补全脚本：
 * 1. 删除非黑客松的比赛/挑战赛/夏令营/评测/路演
 * 2. 从原始描述中提取奖金、组织方等缺失信息
 * 运行: npx tsx scripts/cleanup-hackathon-navigator.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hackathons } from '../lib/db/schema';
import { sql, eq, and, inArray } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL!));

// ===== 第一步：要删除的非黑客松赛事 =====
// 这些是创新大赛、评测、夏令营、路演、青少年挑战赛等，不是黑客松
const NOT_HACKATHONS = [
  'hn-ccks2026-大模型行为调控评测',
  'hn-挑战杯-揭榜挂帅-擂台赛-ai赛道',
  'hn-中国-人工智能--创新创业挑战赛',
  'hn-全国青少年ai创新挑战赛-第九届',
  'hn-华为昇腾ai创新大赛2026',
  'hn-datawhale-ai夏令营',
  'hn-通义千问ai挑战赛',
  'hn-ieee-aicas-2026-grand-challenge',
  'hn-数字中国创新大赛-ai赛道',
  'hn-2026金砖国家工业创新大赛-ai赛道',
  'hn-华为hdc-鸿蒙开发者大赛',
  'hn-大模型创意创新应用大赛-复旦',
  'hn-南京晓庄学院-ai应用场景创新赛',
  'hn-京西智谷ai创新创业大赛',
  'hn-智谱ai-glm应用开发赛',
  'hn-weex-ai-trading-hackathon-season-2',  // 量化交易比赛，不是 build hackathon
  'hn-昆明-金砖ai赛道选拔赛',
  'hn-waic-opc独立先锋挑战赛',      // 创业路演
  'hn-waic-opc-北京城市赛',          // 创业路演
  'hn-waic-opc-深圳城市赛',          // 创业路演
  'hn-waic-opc-城市嘉年华10城',      // 创业路演
  'hn-灵拓ltop-华南复赛路演',        // 路演
  'hn-empire-code-global-ai-hackathon', // 8-16 岁少儿
  'hn-火山引擎-扣子agent大赛',       // Agent 开发赛（非限时 hackathon）
];

// ===== 第二步：补全信息 =====
// 从原始爬取数据中提取的奖金、组织方信息
const ENRICHMENTS: Record<string, {
  prizePool?: string;
  organizer?: string;
  description?: string;
}> = {
  'hn-mindspore量子计算黑客松-第八届': {
    organizer: '华为 MindSpore',
    description: '量子启发算法、组合优化赛道，需先完成热身赛',
  },
  'hn-抖音ai创变者计划-黑客松联赛': {
    prizePool: '¥100万+',
    organizer: '抖音',
    description: '高校生专属，总奖池100万+，全国多站巡回黑客松',
  },
  'hn-腾讯云黑客松-游戏开发挑战赛': {
    organizer: '腾讯云',
    description: 'AI驱动游戏创作，1-3人团队，多赛区路演，深圳总决赛',
  },
  'hn-腾讯云黑客松-华东赛区': {
    organizer: '腾讯云',
    description: 'AI游戏创作黑客松，上海站',
  },
  'hn-腾讯云黑客松-华北赛区': {
    organizer: '腾讯云',
    description: 'AI游戏创作黑客松，北京站路演',
  },
  'hn-腾讯云黑客松-华中赛区': {
    organizer: '腾讯云',
    description: 'AI游戏创作黑客松，武汉站',
  },
  'hn-腾讯云黑客松-总决赛': {
    organizer: '腾讯云',
    description: '腾讯全球数字生态大会期间，深圳总决赛',
  },
  'hn-腾讯云黑客松-港澳赛区': {
    organizer: '腾讯云',
    description: 'AI游戏创作黑客松，港澳赛区路演',
  },
  'hn-百度飞桨黑客马拉松-新一期': {
    organizer: '百度飞桨',
    description: '开源框架+国产硬件适配赛道黑客马拉松',
  },
  'hn-上海-徐汇量子黑客松': {
    organizer: '上海徐汇区',
    description: '48小时极限编程，五大产业应用赛道',
  },
  'hn-抖音ai创变者-上海金山站': {
    organizer: '抖音',
    description: '漕泾数字游民村，乡村振兴+AI内容创作黑客松',
  },
  'hn-抖音ai创变者-合肥模立方站': {
    organizer: '抖音',
    description: 'AI体验+视觉搜索赛道，140余名选手参赛',
  },
  'hn-抖音ai创变者-山东站': {
    organizer: '抖音',
    description: '济南齐鲁软件园，互动空间赛道黑客松',
  },
  'hn-云简业财ai-hackathon走进上外贸': {
    organizer: '云简业财 × 上海对外经贸大学',
    description: '会计学院×云简业财联合举办，6-8人组队黑客松',
  },
  'hn-超聚变ai-hackathon': {
    organizer: '超聚变',
    description: 'AI重构软件开发范式，模型驱动研发黑客松',
  },
  'hn-环球黑客松-高校联赛2026': {
    organizer: '魔搭社区 ModelScope',
    description: '12所顶尖高校联合发起的AI应用开发黑客松',
  },
  'hn-环球黑客松-哈工大站': {
    organizer: '魔搭社区 × 哈工大',
    description: 'AI应用开发，跨学科协作黑客松',
  },
  'hn-世界智能产业博览会-黑客松': {
    organizer: '天津市政府',
    description: '天津天开高教科创园，42小时极限赛黑客松',
  },
  'hn-beyond-hack-day-澳门': {
    prizePool: '¥100万+',
    organizer: 'BEYOND Expo',
    description: '百万奖金，AI四大赛道，澳门威尼斯人黑客松',
  },
  'hn-goat-network-深圳ai-web3': {
    organizer: 'GOAT Network',
    description: 'Bitcoin L2 + AI Agent实战黑客松',
  },
  'hn-builderx恰同学少年-黑客松': {
    prizePool: '¥5万+',
    organizer: 'BuilderX × CSDN',
    description: '长沙智谷，智能硬件+Agent赛道，奖金5万+',
  },
  'hn-ultra-maker黑客松-北京站': {
    organizer: 'Ultra Maker',
    description: '海淀，AI创业主题黑客松',
  },
  'hn-unescap全球黑客松-数字贸易监管': {
    organizer: '联合国 UNESCAP',
    description: '联合国主办，全程线上，费用全包的数字贸易黑客松',
  },
  'hn-沈阳-unescap全球黑客松': {
    organizer: '联合国 UNESCAP × 沈阳工学院',
    description: '联合国主办线上赛，沈阳工学院承接',
  },
  'hn-mantle-2026图灵测试黑客松': {
    prizePool: '$120,000',
    organizer: 'Mantle Network',
    description: '12万美元奖金，AI Agent+链上金融黑客松',
  },
  'hn-moonshot-universe黑客松': {
    prizePool: '$10,000,000+ 投资',
    organizer: 'Creditcoin × DoraHacks',
    description: 'RWA/DeFi七大赛道，千万美元投资机会黑客松',
  },
  'hn-0g-hackquest亚太黑客松': {
    prizePool: '$150,000',
    organizer: '0G × HackQuest',
    description: '15万美元，AI链上记忆/可验证金融黑客松',
  },
  'hn-agent-economy-on-bitcoin--goat': {
    organizer: 'GOAT Network',
    description: 'AI智能体+BTC L2，x402支付协议黑客松',
  },
  'hn-国际开源黑客松-数字游民': {
    organizer: 'FTC',
    description: '上海外滩FTC，开源×数字游民主题黑客松',
  },
  'hn-蚂蚁集团-第十一届黑客松': {
    organizer: '蚂蚁集团',
    description: '527技术日配套活动，内部+外部赛道黑客松',
  },
  'hn-cosdata---nugen-ai-hackathon': {
    prizePool: '$10,000+',
    organizer: 'Cosdata × Nugen',
    description: '生产级AI应用，Antler VC投资机会，$10K+奖池黑客松',
  },
  'hn-sogni-ai-global-student-hackathon': {
    prizePool: '$4,500 + 2500万 SOGNI',
    organizer: 'Sogni AI × NTU',
    description: 'NTU主办，AI+Web3，$4500奖金+2500万SOGNI代币黑客松',
  },
  'hn-token2049-origins-hackathon': {
    prizePool: '$100,000',
    organizer: 'TOKEN2049',
    description: 'TOKEN2049配套赛事，$10万奖池，Web3+AI融合黑客松',
  },
};

async function cleanup() {
  // 第一步：删除非黑客松赛事
  console.log('=== 第一步：删除非黑客松赛事 ===\n');

  const toDelete = await db
    .select({ id: hackathons.id, name: hackathons.name, slug: hackathons.slug })
    .from(hackathons)
    .where(
      and(
        eq(hackathons.sourceUrl, 'https://hackathon-navigator.vercel.app/'),
        inArray(hackathons.slug, NOT_HACKATHONS)
      )
    );

  for (const row of toDelete) {
    await db.delete(hackathons).where(eq(hackathons.id, row.id));
    console.log(`  🗑️ 已删除: ${row.name}`);
  }
  console.log(`\n删除了 ${toDelete.length} 条非黑客松赛事\n`);

  // 第二步：补全信息
  console.log('=== 第二步：补全奖金/组织方信息 ===\n');

  let enriched = 0;
  for (const [slug, data] of Object.entries(ENRICHMENTS)) {
    const updateSet: Record<string, any> = { updatedAt: sql`now()` };
    if (data.prizePool) updateSet.prizePool = data.prizePool;
    if (data.organizer) updateSet.organizer = data.organizer;
    if (data.description) updateSet.description = data.description;

    const result = await db
      .update(hackathons)
      .set(updateSet)
      .where(eq(hackathons.slug, slug))
      .returning({ name: hackathons.name });

    if (result.length > 0) {
      const fields = [];
      if (data.prizePool) fields.push(`奖金=${data.prizePool}`);
      if (data.organizer) fields.push(`组织方=${data.organizer}`);
      if (data.description) fields.push('描述✓');
      console.log(`  ✏️ ${result[0].name}: ${fields.join(', ')}`);
      enriched++;
    }
  }
  console.log(`\n补全了 ${enriched} 条记录\n`);

  // 第三步：最终审计
  console.log('=== 最终审计 ===\n');
  const remaining = await db
    .select({
      name: hackathons.name,
      prizePool: hackathons.prizePool,
      organizer: hackathons.organizer,
      city: hackathons.city,
      status: hackathons.status,
    })
    .from(hackathons)
    .where(eq(hackathons.sourceUrl, 'https://hackathon-navigator.vercel.app/'));

  let complete = 0;
  let incomplete = 0;
  for (const r of remaining) {
    const issues: string[] = [];
    if (!r.prizePool) issues.push('奖金❌');
    if (!r.organizer) issues.push('组织方❌');
    const marker = issues.length ? '⚠️' : '✅';
    if (issues.length) incomplete++;
    else complete++;
    console.log(`  ${marker} ${r.name} (${r.city || '线上'}, ${r.status}) ${issues.join(' ')}`);
  }

  console.log(`\n保留 ${remaining.length} 场黑客松 | 完整 ${complete} | 仍缺信息 ${incomplete}`);
}

cleanup().catch(console.error);
