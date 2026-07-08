/**
 * ============================================================================
 *  HackerTrip — Mock 种子数据
 * ============================================================================
 *
 *  3 个完整的示例用户（不同主角色），驱动 `npm run dev` 后无 DB 的全链路体验：
 *  /identity/new 预览、/u/[username] 主页、og 卡图、分享内容包。
 *
 *  - 角色用 decideRole() 真实算出（保证 mock 与判定逻辑自洽）。
 *  - 履历用真实感的黑客松名（AdventureX / ETHGlobal / 腾讯云AI黑客松 等）。
 *  - getMockIdentity(username) 未知 username 兜底 demo-builder，标 source:'mock'。
 * ============================================================================
 */

import { decideRole } from './roles';
import { createDevConfig } from './config';
import type {
  IdentityCardData,
  CareerItem,
  RoleSignals,
  DevConfig,
} from './types';

/* ----------------------------------------------------------------------------
 * 履历 → RoleSignals 构建（mock 内部用，与真实 signals 同构）
 * -------------------------------------------------------------------------- */

interface MockSeed {
  username: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  github?: string | null;
  twitter?: string | null;
  config: DevConfig;
  career: CareerItem[];
  /** 项目描述关键词（拼接进 taglineKeywords） */
  taglineKeywords: string[];
  profileViews: number;
}

/** 名次是否计入"获奖" */
function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  const p = placement.toLowerCase();
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/.test(p);
}

/** 由 mock seed 推导 RoleSignals，喂给 decideRole */
function seedToSignals(seed: MockSeed): RoleSignals {
  const projectCount = seed.career.filter((c) => c.projectName).length;
  const winCount = seed.career.filter((c) => isWin(c.placement)).length;
  const awards = seed.career.map((c) => c.placement).filter((p): p is string => Boolean(p));
  const participantRoles = seed.career.map((c) => c.role);
  return {
    techStack: seed.config.techStack,
    awards,
    projectCount,
    participationCount: seed.career.length,
    winCount,
    taglineKeywords: seed.taglineKeywords,
    participantRoles,
    shippingVelocity: seed.career.length > 0 ? projectCount / seed.career.length : 0,
  };
}

/** 统计条 */
function seedToStats(seed: MockSeed) {
  return {
    projects: seed.career.filter((c) => c.projectName).length,
    hackathons: seed.career.length,
    awards: seed.career.filter((c) => isWin(c.placement)).length,
  };
}

/* ----------------------------------------------------------------------------
 * 三个示例用户 seed
 * -------------------------------------------------------------------------- */

const SEEDS: MockSeed[] = [
  // ① demo-builder — 从零到一搭建者 / 死线快枪
  {
    username: 'demo-builder',
    displayName: 'Leo Zhang',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    bio: '全栈独狼，48 小时把想法跑成 Demo。Next.js + Claude Code 一把梭。',
    location: '杭州',
    github: 'leozhang',
    twitter: 'leobuilds',
    config: createDevConfig({
      techStack: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      tools: ['VS Code', 'Vercel', 'Neon', 'GitHub'],
      aiTools: ['Claude Code', 'Claude', 'v0'],
      env: 'macOS + VS Code + iTerm2',
      playStyle: 'solo',
      strengths: ['全栈开发', 'AI Agent', '增长/裂变'],
      lookingFor: 'cofounder',
    }),
    taglineKeywords: ['mvp', 'fullstack', 'next', 'ship', 'fast', 'prototype', 'scaffold', 'demo'],
    profileViews: 1247,
    career: [
      {
        id: 'p-builder-1',
        hackathonName: 'AdventureX 2026',
        hackathonLogo: null,
        dateRange: '2026.07',
        role: 'winner',
        placement: '1st',
        projectName: 'ShipFast',
        projectTagline: '一句话生成可部署的全栈 SaaS 脚手架',
        track: 'AI 应用',
        verified: true,
      },
      {
        id: 'p-builder-2',
        hackathonName: 'ETHGlobal Bangkok',
        hackathonLogo: null,
        dateRange: '2026.04',
        role: 'participant',
        placement: 'finalist',
        projectName: 'OnchainPay',
        projectTagline: '面向中小商户的链上一键收款',
        track: 'Payments',
        verified: false,
      },
      {
        id: 'p-builder-3',
        hackathonName: '腾讯云 AI 黑客松',
        hackathonLogo: null,
        dateRange: '2026.01',
        role: 'participant',
        placement: null,
        projectName: 'DocChat',
        projectTagline: '企业文档问答助手',
        track: '企业效率',
        verified: false,
      },
    ],
  },

  // ② demo-alchemist — 深不见底炼丹师 / 数据占卜师
  {
    username: 'demo-alchemist',
    displayName: 'Mia Chen',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    bio: '炼丹师一枚，RAG/微调/Agent 都玩。把模型炼成想要的形状。',
    location: '上海',
    github: 'miachen',
    twitter: 'mia_alchemy',
    config: createDevConfig({
      techStack: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'PostgreSQL'],
      tools: ['Cursor', 'Docker', 'GitHub', 'Supabase'],
      aiTools: ['Cursor', 'Claude', 'ChatGPT', 'Perplexity'],
      env: 'Ubuntu + Cursor + tmux',
      playStyle: 'duo',
      strengths: ['算法/模型', 'AI Agent', '数据可视化'],
      lookingFor: 'teammate',
    }),
    taglineKeywords: ['llm', 'rag', 'agent', 'finetune', 'embedding', 'pytorch', 'data', 'analytics', 'pandas'],
    profileViews: 893,
    career: [
      {
        id: 'p-alch-1',
        hackathonName: 'AdventureX 2026',
        hackathonLogo: null,
        dateRange: '2026.07',
        role: 'winner',
        placement: '2nd',
        projectName: 'AlphaRAG',
        projectTagline: '面向法律文书的高精度 RAG 检索引擎',
        track: 'AI 基础设施',
        verified: true,
      },
      {
        id: 'p-alch-2',
        hackathonName: 'Anthropic Builder Day',
        hackathonLogo: null,
        dateRange: '2026.05',
        role: 'participant',
        placement: null,
        projectName: 'AgentMesh',
        projectTagline: '多 Agent 协作编排框架',
        track: 'Agents',
        verified: true,
      },
      {
        id: 'p-alch-3',
        hackathonName: 'Kaggle Days China',
        hackathonLogo: null,
        dateRange: '2026.03',
        role: 'participant',
        placement: null,
        projectName: 'ChurnLens',
        projectTagline: '用户流失预测与可视化看板',
        track: '数据科学',
        verified: false,
      },
      {
        id: 'p-alch-4',
        hackathonName: '稀土掘金 AI 创造营',
        hackathonLogo: null,
        dateRange: '2025.12',
        role: 'mentor',
        placement: null,
        projectName: null,
        projectTagline: null,
        track: null,
        verified: false,
      },
    ],
  },

  // ③ demo-carver — 像素级雕花匠 / 一页封神叙事者
  {
    username: 'demo-carver',
    displayName: 'Aria Wu',
    avatar: 'https://avatars.githubusercontent.com/u/2649214?v=4',
    bio: '对齐到 1px 的设计型前端。动效、留白、叙事一把抓。',
    location: '深圳',
    github: 'ariawu',
    twitter: 'aria_pixels',
    config: createDevConfig({
      techStack: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
      tools: ['Figma', 'VS Code', 'Vercel'],
      aiTools: ['v0', 'Claude', 'Cursor'],
      env: 'macOS + Figma + VS Code',
      playStyle: 'squad',
      strengths: ['UI/动效', '产品/叙事', '全栈开发'],
      lookingFor: 'none',
    }),
    taglineKeywords: ['ui', 'ux', 'tailwind', 'figma', 'framer', 'animation', 'design', 'pitch', 'story', 'present'],
    profileViews: 562,
    career: [
      {
        id: 'p-carve-1',
        hackathonName: 'ETHGlobal Singapore',
        hackathonLogo: null,
        dateRange: '2026.06',
        role: 'winner',
        placement: 'finalist',
        projectName: 'GlassWallet',
        projectTagline: '把 Web3 钱包做成丝滑的玻璃拟态体验',
        track: 'Consumer',
        verified: true,
      },
      {
        id: 'p-carve-2',
        hackathonName: '字节跳动 PixelHack',
        hackathonLogo: null,
        dateRange: '2026.02',
        role: 'participant',
        placement: null,
        projectName: 'MotionDeck',
        projectTagline: '一键生成带动效的产品路演页',
        track: '创意工具',
        verified: false,
      },
    ],
  },
];

/* ----------------------------------------------------------------------------
 * 组装成 IdentityCardData
 * -------------------------------------------------------------------------- */

function buildMockIdentity(seed: MockSeed): IdentityCardData {
  const signals = seedToSignals(seed);
  const role = decideRole(signals);
  return {
    username: seed.username,
    displayName: seed.displayName,
    avatar: seed.avatar ?? null,
    bio: seed.bio ?? null,
    location: seed.location ?? null,
    github: seed.github ?? null,
    twitter: seed.twitter ?? null,
    role,
    config: seed.config,
    career: seed.career,
    stats: seedToStats(seed),
    profileViews: seed.profileViews,
    source: 'mock',
  };
}

/** 全部 mock 用户（已组装），供页面遍历/索引 */
export const MOCK_USERS: IdentityCardData[] = SEEDS.map(buildMockIdentity);

/** username → IdentityCardData 索引 */
const MOCK_INDEX: Record<string, IdentityCardData> = MOCK_USERS.reduce(
  (acc, u) => {
    acc[u.username.toLowerCase()] = u;
    return acc;
  },
  {} as Record<string, IdentityCardData>,
);

/** 兜底用户（未知 username 时返回） */
export const DEFAULT_MOCK_USERNAME = 'demo-builder';

/**
 * getMockIdentity — 按 username 取 mock 身份卡。
 * 未知 username → 返回 demo-builder 兜底（仍标 source:'mock'）。
 */
export function getMockIdentity(username?: string | null): IdentityCardData {
  const key = (username ?? '').trim().toLowerCase();
  return MOCK_INDEX[key] ?? MOCK_INDEX[DEFAULT_MOCK_USERNAME];
}

/** 全站"已生成身份卡"社会证明计数（mock，pull 端展示用） */
export const MOCK_TOTAL_CARDS_GENERATED = 3128;
