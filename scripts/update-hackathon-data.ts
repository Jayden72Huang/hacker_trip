/**
 * 补全+清理黑客松草稿数据
 * 运行: npx tsx scripts/update-hackathon-data.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const BATCH_TAG = '2026-05-20-multi-city-search';

async function deleteInvalid() {
  const toDelete = [
    "打造你的首个 AI 员工 Workshop",          // 所有平台找不到
    "ZhenFund x AWS x Linkloud Growth Hackathon", // 实际是 2023 年活动
    "广州 xB@B 黑客松",                        // 实际是 Berkeley, CA 活动
    "Z-Heronix Deep 深圳女性黑客松",           // 网上无任何信息
    "Eunos Hackathon",                         // 3 小时社区活动，信息极少
    "2026 空间上海：24 小时 AR/VR 黑客马拉松", // 几乎无任何可验证信息
  ];

  for (const name of toDelete) {
    const r = await sql`DELETE FROM draft_hackathon WHERE name = ${name} AND raw_data::text LIKE ${'%' + BATCH_TAG + '%'}`;
    console.log(`  🗑️  删除: ${name}`);
  }
  console.log(`\n共删除 ${toDelete.length} 条问题数据\n`);
}

interface UpdateItem {
  matchName: string;
  updates: Record<string, any>;
}

async function updateRecords() {
  const updates: UpdateItem[] = [
    // ========== 北京 ==========
    {
      matchName: "超越之路 Ultra Maker 黑客松 2026 | 北京站",
      updates: {
        source_url: "https://lianpu.com/event/chao-yue-zhi-lu-ultra-maker-hei-ke-song-bei-jing-zhan",
        tracks: JSON.stringify(["Evolution（个体超越赛道）", "Fusion（协同创新赛道）"]),
        sponsors: JSON.stringify([{ name: "AMD" }, { name: "高榕资本" }]),
        confidence: 78,
      },
    },
    {
      matchName: "智能渗透挑战赛",
      updates: {
        name: "第二届腾讯云黑客松 - 智能渗透挑战赛",
        source_url: "https://tch.cloud.tencent.com/",
        venue: "线上初赛 + 线下决赛（北京，4月25日）",
        organizers: JSON.stringify([{ name: "腾讯云鼎实验室" }, { name: "腾讯安全众测平台" }]),
        sponsors: JSON.stringify([{ name: "腾讯云" }]),
        tracks: JSON.stringify(["AI 自主渗透测试（SRC 漏洞发现 / CVE 云安全 / 多层网络渗透 / 域控内网推演）", "零界 - AI 社交博弈（提示词注入对抗 / 密钥交换 / 影响力竞争）"]),
        confidence: 85,
      },
    },
    {
      matchName: "FlagOS Open Computing Global Challenge",
      updates: {
        tracks: JSON.stringify(["Operator Development（算子开发）", "Large Model Inference Optimization（大模型推理加速）", "Automatic Data Annotation（自动数据标注）"]),
        confidence: 88,
      },
    },
    {
      matchName: "Mother Board「生·无界」母亲节特别场黑客松 | 北京站",
      updates: {
        source_url: "https://lianpu.com/event/mother-board-sheng-wu-jie-mu-qin-jie-te-bie-chang-hei-ke-son",
        tracks: JSON.stringify(["生命", "生长", "生产"]),
        confidence: 78,
      },
    },
    {
      matchName: "40 小时 StartBuild 黑客松 北京站",
      updates: {
        source_url: "https://lianpu.com/event/40-xiao-shi-startbuild-hei-ke-song-bei-jing-zhan",
        confidence: 73,
      },
    },

    // ========== 上海 ==========
    {
      matchName: "Mother Board「生·无界」母亲节特别场黑客松 | 上海站",
      updates: {
        tracks: JSON.stringify(["生命", "生长", "生产"]),
        confidence: 78,
      },
    },
    {
      matchName: "Ship it Sunday #009 | Make something agents want",
      updates: {
        prize_pool: "~¥1,000",
        tracks: JSON.stringify(["为 AI Agent 构建可用的工具与环境"]),
        confidence: 72,
      },
    },
    {
      matchName: "GSMA-中国电信 Open Gateway 编程马拉松",
      updates: {
        tracks: JSON.stringify(["Open Gateway CAMARA API 创新应用", "Quality of Service on Demand", "Device Location", "Device Status"]),
        confidence: 88,
      },
    },
    {
      matchName: "LYCC 2026 龙华黑客松",
      updates: {
        tracks: JSON.stringify(["青年消费", "出行", "居住", "AI 改造未来生活方式"]),
        confidence: 78,
      },
    },
    {
      matchName: "上海 AI 超级产品黑客松",
      updates: {
        tracks: JSON.stringify(["Vibe Coding AI 产品开发"]),
        confidence: 62,
      },
    },

    // ========== 广深 ==========
    {
      matchName: "She Code Lab 深圳女性硬件黑客松",
      updates: {
        source_url: "https://shenicest.ton-ton.fun/",
        tracks: JSON.stringify(["AI 硬件 / 女性可穿戴设备"]),
        summary: "内地首场女性硬件黑客松，约 400 人报名，48 小时开发创新硬件产品。90% 参赛者为女性，70% 为 00 后。获奖作品包括经前综合症疗愈耳机 Mooncare、夜间导航 AI 眼镜 SheLens 等。",
        confidence: 88,
      },
    },
    {
      matchName: "AttraX「春潮·Spring」深圳 OpenClaw 黑客松",
      updates: {
        source_url: "https://lianpu.com/event/chun-chao-spring-ai-ying-jian-hei-ke-song",
        tracks: JSON.stringify(["AI 赛道", "硬件赛道"]),
        confidence: 78,
      },
    },
    {
      matchName: "2026 HarmonyOS 创新赛·极客赛道",
      updates: {
        source_url: "https://developer.huawei.com/consumer/cn/activity/digixActivity/digixcmsdetail/101773710117484023",
        venue: "线上初赛 + 线下决赛于 HDC 2026（东莞松山湖，6月12-14日）",
        summary: "华为旗舰开发者竞赛，36 小时极限开发，TOP20 进入总冠军赛。决赛在 HDC 2026 大会（东莞松山湖）展示，获核心专家指导和生态资源。",
        confidence: 90,
      },
    },

    // ========== 杭州 ==========
    {
      matchName: "AdventureX 2026",
      updates: {
        venue: "杭州未来科技城·学术交流中心",
        sponsors: JSON.stringify([{ name: "Rokid" }, { name: "百度" }, { name: "Insta360" }, { name: "XMind" }, { name: "潮汐" }]),
        summary: "由高中生创办的中国最大黑客松，800+ 参赛者，72 小时密集开发。免费包吃住，符合条件可申请旅费报销。面向 26 岁以下年轻人和在校学生。",
        confidence: 88,
      },
    },

    // ========== 新加坡 ==========
    {
      matchName: "BrainHack 2026",
      updates: {
        tracks: JSON.stringify(["Cyber Defenders Discovery Camp (CTF)", "Today I Learned - AI (TIL-AI)", "Roboverse（机器人挑战）", "CODE_EXP（Web 开发）"]),
        sponsors: JSON.stringify([{ name: "AngelHack" }]),
        confidence: 88,
      },
    },
    {
      matchName: "GovTech {build} Hackathon 2026",
      updates: {
        tracks: JSON.stringify(["User Research", "Design", "Development", "Vibe Coding", "Pitching", "Product Management"]),
        confidence: 78,
      },
    },

    // ========== OPC ==========
    {
      matchName: "OPC 独立先锋挑战赛（WAIC 2026）",
      updates: {
        venue: "10 大城市赛区 → 总决赛：上海世博中心（WAIC 2026, 7月）",
        prize_pool: "¥10,000 奖金 + 入驻超级个体社区（租金补贴+算力+孵化支持）",
        sponsors: JSON.stringify([{ name: "OpenCSG" }, { name: "商汤科技" }, { name: "中国电信" }, { name: "阿里云无影" }, { name: "科大讯飞" }, { name: "Rokid" }]),
        confidence: 85,
      },
    },
  ];

  for (const item of updates) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    for (const [key, value] of Object.entries(item.updates)) {
      if (key === 'tracks' || key === 'sponsors' || key === 'organizers') {
        setClauses.push(`${key} = $${paramIdx}::jsonb`);
      } else {
        setClauses.push(`${key} = $${paramIdx}`);
      }
      values.push(value);
      paramIdx++;
    }

    const query = `UPDATE draft_hackathon SET ${setClauses.join(', ')} WHERE name = $${paramIdx} AND raw_data::text LIKE $${paramIdx + 1}`;
    values.push(item.matchName, `%${BATCH_TAG}%`);

    await sql.query(query, values);
    console.log(`  ✏️  更新: ${item.matchName}`);
  }

  console.log(`\n共更新 ${updates.length} 条记录\n`);
}

async function main() {
  console.log('=== 第一步：删除问题数据 ===\n');
  await deleteInvalid();

  console.log('=== 第二步：补全缺失信息 ===\n');
  await updateRecords();

  // 统计最终结果
  const remaining = await sql`
    SELECT count(*) as total,
           count(*) FILTER (WHERE confidence >= 80) as high,
           count(*) FILTER (WHERE confidence >= 60 AND confidence < 80) as mid,
           count(*) FILTER (WHERE confidence < 60) as low
    FROM draft_hackathon
    WHERE raw_data::text LIKE ${'%' + BATCH_TAG + '%'}
  `;
  const r = remaining[0];
  console.log('=== 最终数据质量 ===');
  console.log(`总数: ${r.total}`);
  console.log(`高置信度(≥80): ${r.high}`);
  console.log(`中置信度(60-79): ${r.mid}`);
  console.log(`低置信度(<60): ${r.low}`);
}

main().catch(console.error);
