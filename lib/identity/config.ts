/**
 * ============================================================================
 *  HackerTrip — 开发者配置卡：预置选项 + 工厂函数
 * ============================================================================
 *
 *  录入表单 chips 的数据源、打法/组队元数据，全部源自 lib/identity/types.ts，
 *  本文件做"实现层便捷封装"（默认工厂、归一化、从扫描结果构建），不另立类型。
 * ============================================================================
 */

import {
  DEV_CONFIG_PRESETS,
  PLAY_STYLE_META,
  LOOKING_FOR_META,
  EMPTY_DEV_CONFIG,
  type DevConfig,
  type PlayStyle,
  type LookingFor,
} from './types';

// 重新导出预置常量与元数据，供 UI 一处 import
export { DEV_CONFIG_PRESETS, PLAY_STYLE_META, LOOKING_FOR_META, EMPTY_DEV_CONFIG };

/** 全部打法风格 key（按展示顺序），UI 渲染选项用 */
export const PLAY_STYLE_OPTIONS: readonly PlayStyle[] = ['solo', 'duo', 'squad', 'flexible'];

/** 全部组队意向 key（按展示顺序），UI 渲染选项用 */
export const LOOKING_FOR_OPTIONS: readonly LookingFor[] = ['none', 'teammate', 'cofounder'];

/* ----------------------------------------------------------------------------
 * 工厂 / 归一化
 * -------------------------------------------------------------------------- */

/** 去重 + 去空白（保留原始大小写，trim） */
function dedupe(arr: string[] | undefined): string[] {
  if (!arr) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const v = (raw ?? '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/**
 * createDevConfig — 默认 DevConfig 工厂。
 * 不传参数返回深拷贝的空配置（录入页初始 state）；
 * 传 partial 时做字段合并 + 数组归一化，保证类型完整、无 undefined 成员。
 */
export function createDevConfig(partial?: Partial<DevConfig>): DevConfig {
  return {
    techStack: dedupe(partial?.techStack),
    tools: dedupe(partial?.tools),
    aiTools: dedupe(partial?.aiTools),
    env: (partial?.env ?? '').trim(),
    playStyle: partial?.playStyle ?? EMPTY_DEV_CONFIG.playStyle,
    strengths: dedupe(partial?.strengths),
    lookingFor: partial?.lookingFor ?? EMPTY_DEV_CONFIG.lookingFor,
  };
}

/**
 * mergeDevConfig — 用 patch 覆盖 base，数组字段整体替换（非追加）并归一化。
 * 用于录入页表单实时编辑。
 */
export function mergeDevConfig(base: DevConfig, patch: Partial<DevConfig>): DevConfig {
  return createDevConfig({ ...base, ...patch });
}

/* ----------------------------------------------------------------------------
 * 从 ht-scan-project 扫描结果导入配置卡
 * -------------------------------------------------------------------------- */

/** ht-scan-project 输出的最小子集（仅取构建配置卡所需字段） */
export interface ScanProjectResult {
  /** 项目技术栈（语言/框架） */
  techStack?: string[];
  /** 领域标签，如 'ai' / 'web3' / 'data' */
  domain?: string | string[];
  /** 可选：检测到的 AI 工具 */
  aiTools?: string[];
  /** 可选：检测到的工具链 */
  tools?: string[];
}

/** 领域标签 → 擅长方向（strengths）映射，命中即补充 */
const DOMAIN_TO_STRENGTH: Readonly<Record<string, string>> = {
  ai: 'AI Agent',
  agent: 'AI Agent',
  llm: 'AI Agent',
  fullstack: '全栈开发',
  frontend: 'UI/动效',
  ui: 'UI/动效',
  data: '数据可视化',
  web3: 'Web3/合约',
  blockchain: 'Web3/合约',
  backend: '后端/基础设施',
  infra: '后端/基础设施',
  growth: '增长/裂变',
  api: 'API 集成',
};

/**
 * devConfigFromScan — 把扫描结果合并进已有/默认配置卡。
 * 技术栈直接取扫描 techStack；domain 推导 strengths；aiTools/tools 若有则带入。
 * 纯函数，扫描失败时调用方传 undefined 即降级为 base/空配置。
 */
export function devConfigFromScan(
  scan: ScanProjectResult | null | undefined,
  base?: DevConfig,
): DevConfig {
  const start = base ? createDevConfig(base) : createDevConfig();
  if (!scan) return start;

  const domains = Array.isArray(scan.domain)
    ? scan.domain
    : scan.domain
      ? [scan.domain]
      : [];

  const derivedStrengths = domains
    .map((d) => DOMAIN_TO_STRENGTH[d.toLowerCase()])
    .filter((s): s is string => Boolean(s));

  return createDevConfig({
    techStack: [...start.techStack, ...(scan.techStack ?? [])],
    tools: [...start.tools, ...(scan.tools ?? [])],
    aiTools: [...start.aiTools, ...(scan.aiTools ?? [])],
    env: start.env,
    playStyle: start.playStyle,
    strengths: [...start.strengths, ...derivedStrengths],
    lookingFor: start.lookingFor,
  });
}
