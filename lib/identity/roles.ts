/**
 * ============================================================================
 *  HackerTrip — 角色判定纯函数 (decideRole / computeRole)
 * ============================================================================
 *
 *  纯函数、零副作用、零 DB 依赖 —— Edge / Node / Client 三端可复用。
 *  输入 RoleSignals，输出 RoleResult（primary + 最多 2 个 secondary）。
 *  权重规则严格遵循 IDENTITY-DESIGN.md §5。
 *
 *  类型契约只认 lib/identity/types.ts，本文件不另立同义类型。
 * ============================================================================
 */

import {
  ROLES,
  ROLE_MAP,
  DEFAULT_ROLE_RESULT,
  type HackathonRoleKey,
  type HackathonRoleMeta,
  type RoleSignals,
  type RoleResult,
  type RoleScore,
} from './types';

// 重新导出元数据，方便实现层一处 import 拿到判定 + 元数据
export { ROLES, ROLE_MAP, DEFAULT_ROLE_RESULT };
export type { HackathonRoleMeta };

/* ----------------------------------------------------------------------------
 * 技术栈"大类"归一 —— 用于 hexagon_allround 的跨类判定
 * -------------------------------------------------------------------------- */

type TechCategory =
  | 'frontend'
  | 'backend'
  | 'ai'
  | 'data'
  | 'web3'
  | 'design'
  | 'infra'
  | 'mobile';

/** 关键词 → 大类，命中即归类（小写匹配，子串包含） */
const TECH_CATEGORY_KEYWORDS: Readonly<Record<TechCategory, string[]>> = {
  frontend: ['react', 'vue', 'svelte', 'next', 'nuxt', 'tailwind', 'css', 'html', 'vite', 'typescript', 'javascript'],
  backend: ['node', 'fastapi', 'express', 'django', 'flask', 'go', 'rust', 'java', 'spring', 'graphql', 'grpc'],
  ai: ['llm', 'ai', 'ml', 'pytorch', 'tensorflow', 'langchain', 'openai', 'rag', 'embedding', 'agent', 'transformers'],
  data: ['pandas', 'sql', 'postgres', 'duckdb', 'spark', 'analytics', 'etl', 'numpy', 'bigquery'],
  web3: ['solidity', 'web3', 'evm', 'ethers', 'wallet', 'defi', 'nft', 'foundry', 'hardhat', 'wagmi'],
  design: ['figma', 'framer', 'design', 'motion', 'animation', 'ui', 'ux'],
  infra: ['docker', 'k8s', 'kubernetes', 'redis', 'cloudflare', 'vercel', 'aws', 'devops', 'terraform', 'nginx'],
  mobile: ['swift', 'kotlin', 'flutter', 'react native', 'expo', 'android', 'ios'],
};

/** 统计技术栈横跨的大类数量（用于六边形全能战士判定） */
function countTechCategories(techStack: string[]): { count: number; categories: TechCategory[] } {
  const hit = new Set<TechCategory>();
  for (const raw of techStack) {
    const t = raw.toLowerCase();
    for (const cat of Object.keys(TECH_CATEGORY_KEYWORDS) as TechCategory[]) {
      if (TECH_CATEGORY_KEYWORDS[cat].some((kw) => t.includes(kw))) {
        hit.add(cat);
      }
    }
  }
  return { count: hit.size, categories: Array.from(hit) };
}

/* ----------------------------------------------------------------------------
 * 关键词命中工具
 * -------------------------------------------------------------------------- */

/** 在 haystack（已小写）中命中 needle（已小写，子串匹配），返回命中的 needle 列表 */
function matchKeywords(haystack: string[], needles: readonly string[]): string[] {
  const joined = haystack.join(' ');
  const hits: string[] = [];
  for (const n of needles) {
    const key = n.toLowerCase();
    if (joined.includes(key)) hits.push(n);
  }
  return hits;
}

/* ----------------------------------------------------------------------------
 * 主判定函数
 * -------------------------------------------------------------------------- */

/**
 * decideRole — 角色判定纯函数。
 *
 * @param signals 判定输入快照（来源 projects/participations/扫描结果）
 * @param manualOverride 用户手动锁定的主角色；若提供则跳过算法、直接采用
 * @returns RoleResult（primary 必有；secondary 最多 2；scores 全量打分）
 */
export function decideRole(
  signals: RoleSignals,
  manualOverride?: HackathonRoleKey | null,
): RoleResult {
  const techStack = (signals.techStack ?? []).map((s) => s.toLowerCase());
  const taglineKeywords = (signals.taglineKeywords ?? []).map((s) => s.toLowerCase());
  const participantRoles = (signals.participantRoles ?? []).map((s) => s.toLowerCase());
  const projectCount = signals.projectCount ?? 0;
  const winCount = signals.winCount ?? 0;
  const velocity = signals.shippingVelocity ?? 0;

  const { count: techCategoryCount } = countTechCategories(techStack);

  // 初始化每个角色的得分桶
  const scoreMap = new Map<HackathonRoleKey, RoleScore>();
  for (const role of ROLES) {
    scoreMap.set(role.key, { key: role.key, score: 0, reasons: [] });
  }

  const add = (key: HackathonRoleKey, delta: number, reason: string) => {
    const s = scoreMap.get(key);
    if (!s) return;
    s.score += delta;
    s.reasons.push(reason);
  };

  // 规则 1 + 2: techStack / taglineKeywords 命中各角色的 signalKeywords
  for (const role of ROLES) {
    const techHits = matchKeywords(techStack, role.signalKeywords);
    if (techHits.length > 0) {
      add(role.key, techHits.length * 3, `技术栈命中 ${techHits.join('/')}`);
    }
    const tagHits = matchKeywords(taglineKeywords, role.signalKeywords);
    if (tagHits.length > 0) {
      add(role.key, tagHits.length * 2, `项目描述命中 ${tagHits.join('/')}`);
    }
  }

  // 规则 3: 获奖加权 —— narrative_god / deadline_gunner 对 winCount 敏感
  if (winCount > 0) {
    add('narrative_god', winCount * 2, `${winCount} 次获奖，叙事/路演能力突出`);
    add('deadline_gunner', winCount * 2, `${winCount} 次获奖，临场交付能力强`);
  }

  // 规则 4: 数量加权
  if (projectCount >= 3) {
    add('zero_to_one', 4, `已交付 ${projectCount} 个项目，从零搭建经验丰富`);
  }
  if (techCategoryCount >= 3) {
    add('hexagon_allround', 5, `技术栈横跨 ${techCategoryCount} 个领域，全能型选手`);
  }

  // 规则 5: 担任角色加权 —— organizer/judge → narrative_god
  if (participantRoles.includes('organizer') || participantRoles.includes('judge')) {
    add('narrative_god', 2, '担任过组织者/评委，叙事掌控力强');
  }

  // 规则 6: 交付速度 → deadline_gunner
  if (velocity >= 1.2) {
    add('deadline_gunner', 4, `平均每场交付 ${velocity.toFixed(1)} 个项目，手速惊人`);
  }

  // 收敛打分
  const scores: RoleScore[] = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);
  const top = scores[0];

  // 全 0（冷启动）→ 默认角色兜底
  if (!top || top.score <= 0) {
    if (manualOverride) {
      return {
        primary: manualOverride,
        secondary: [],
        scores,
        manualOverride: true,
      };
    }
    return { ...DEFAULT_ROLE_RESULT, scores };
  }

  // 手动覆盖：用户锁定的主角色优先；其余按算法排序补 secondary
  if (manualOverride) {
    const secondary = scores
      .filter((s) => s.key !== manualOverride && s.score > 0)
      .slice(0, 2)
      .map((s) => s.key);
    return { primary: manualOverride, secondary, scores, manualOverride: true };
  }

  const primary = top.key;
  const secondary = scores
    .filter((s) => s.key !== primary && s.score > 0)
    .slice(0, 2)
    .map((s) => s.key);

  return { primary, secondary, scores, manualOverride: false };
}

/** computeRole — decideRole 的别名（任务文档命名），签名一致 */
export const computeRole = decideRole;
