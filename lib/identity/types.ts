/**
 * ============================================================================
 *  HackerTrip — 黑客松身份 / 配置卡 / 裂变 · 冻结类型契约 (Frozen Type Contract)
 * ============================================================================
 *
 *  所有实现 agent 必须 `import` 本文件的类型，禁止各自另立同义类型。
 *  本文件零运行时依赖、纯 TS，可被任何层(Edge / Node / Client)安全引用。
 *
 *  分区:
 *    1. 角色身份系统 (HackathonRole / RoleSignals / RoleResult / ROLES)
 *    2. 开发者配置卡 (DevConfig + 预置选项常量)
 *    3. 参赛履历资产 (CareerItem)
 *    4. 聚合身份卡数据 (IdentityCardData)
 *    5. 裂变分享内容 (ShareContent + 文案模板键)
 *    6. 卡片渲染契约 (CardVariant / CardRenderParams)
 *
 *  约定:
 *    - 颜色一律 hex 字符串 (#RRGGBB)，深色主题，与 app/globals.css 变量同源。
 *    - emoji 仅用于角色徽记/卡面，不用于正文 UI。
 *    - 所有数组字段默认空数组，不允许 undefined 成员。
 * ============================================================================
 */

/* =============================================================================
 * 1. 角色身份系统
 * ========================================================================== */

/**
 * 黑客松角色 key。新增角色必须同步追加到 ROLES 元数据数组。
 * 这是判定算法 (decideRole) 的输出主键，也是配色映射键。
 */
export type HackathonRoleKey =
  | 'zero_to_one'      // 从零到一搭建者
  | 'model_alchemist'  // 深不见底炼丹师
  | 'pixel_carver'     // 像素级雕花匠
  | 'narrative_god'    // 一页封神叙事者
  | 'deadline_gunner'  // 死线当饭吃的快枪
  | 'hexagon_allround' // 六边形全能战士
  | 'infra_plumber'    // 管道工 (后端/基础设施)
  | 'data_diviner'     // 数据占卜师 (数据/分析/可视化)
  | 'chain_ronin'      // 链上浪人 (Web3/合约)
  | 'glue_integrator'; // 万物胶水侠 (集成/API 编排)

/**
 * 角色元数据。colorFrom/colorTo 用于卡面渐变(左上→右下)，
 * 必须落在深色主题可读区间(避免纯黑/纯白)。
 */
export interface HackathonRoleMeta {
  key: HackathonRoleKey;
  /** 中文角色名(展示用) */
  name: string;
  /** 英文别名(URL / og 文案 fallback) */
  nameEn: string;
  /** 一句话人设描述 */
  tagline: string;
  /** 渐变起色 hex */
  colorFrom: string;
  /** 渐变止色 hex */
  colorTo: string;
  /** 角色徽记 emoji */
  emoji: string;
  /** 判定关键信号词(用于 tagline/techStack 命中加权) */
  signalKeywords: string[];
}

/**
 * 判定算法输入。来源: projects[] / participations[] / users 画像 / 扫描结果。
 * 纯数据快照，不含任何 DB 句柄，便于在 Edge / 客户端复用。
 */
export interface RoleSignals {
  /** 全部项目去重后的技术栈(小写归一) */
  techStack: string[];
  /** 获奖名次集合(如 ['1st','finalist'])，来源 participations.placement + projects.awards */
  awards: string[];
  /** 项目数量 */
  projectCount: number;
  /** 参赛(含组织/评委)记录数量 */
  participationCount: number;
  /** 获奖次数(placement 命中名次的条目数) */
  winCount: number;
  /** 所有 project.tagline / description 拼接后的小写关键词流 */
  taglineKeywords: string[];
  /** 担任过的角色集合(participation.role)，含 organizer/mentor/judge 等 */
  participantRoles: string[];
  /** 平均每场比赛交付的项目数(粗略反映"快枪"特征)，可选 */
  shippingVelocity?: number;
}

/** 单个角色的判定得分(供调试 / 透明展示) */
export interface RoleScore {
  key: HackathonRoleKey;
  score: number;
  /** 命中的信号说明，用于 UI "为什么是这个角色" */
  reasons: string[];
}

/**
 * 判定结果。primary 必有；secondary 最多 2 个(去重、按分降序)。
 * manualOverride=true 表示用户手动锁定主角色，判定算法不得覆盖。
 */
export interface RoleResult {
  primary: HackathonRoleKey;
  /** 副角色，最多 2 个 */
  secondary: HackathonRoleKey[];
  /** 全角色打分(可选，仅调试/透明面板用) */
  scores?: RoleScore[];
  /** 是否用户手动锁定 */
  manualOverride: boolean;
}

/**
 * ROLES — 角色元数据单一事实来源。
 * 配色全部为深色主题安全的高饱和渐变，可直接喂给卡片渲染。
 */
export const ROLES: readonly HackathonRoleMeta[] = [
  {
    key: 'zero_to_one',
    name: '从零到一搭建者',
    nameEn: 'Zero-to-One Builder',
    tagline: '空白仓库到可运行 Demo，48 小时一把梭。',
    colorFrom: '#7c5dff',
    colorTo: '#4de1ff',
    emoji: '🚀',
    signalKeywords: ['mvp', 'prototype', 'scaffold', 'fullstack', 'next', 'demo', '从零', '搭建'],
  },
  {
    key: 'model_alchemist',
    name: '深不见底炼丹师',
    nameEn: 'Model Alchemist',
    tagline: '调参、微调、RAG，把模型炼成想要的形状。',
    colorFrom: '#c759ff',
    colorTo: '#7c5dff',
    emoji: '🧪',
    signalKeywords: ['llm', 'ai', 'ml', 'rag', 'finetune', 'pytorch', 'agent', 'embedding', '模型', '炼丹'],
  },
  {
    key: 'pixel_carver',
    name: '像素级雕花匠',
    nameEn: 'Pixel Carver',
    tagline: '动效、留白、对齐到 1px，颜值即正义。',
    colorFrom: '#4de1ff',
    colorTo: '#c759ff',
    emoji: '🎨',
    signalKeywords: ['ui', 'ux', 'tailwind', 'figma', 'framer', 'css', 'animation', 'design', '设计', '动效'],
  },
  {
    key: 'narrative_god',
    name: '一页封神叙事者',
    nameEn: 'Narrative God',
    tagline: '一页 PPT 一段 Demo，把评委讲到鼓掌。',
    colorFrom: '#ff7eb6',
    colorTo: '#7c5dff',
    emoji: '🎤',
    signalKeywords: ['pitch', 'story', 'deck', 'demo', 'present', 'narrative', '叙事', '路演', '故事'],
  },
  {
    key: 'deadline_gunner',
    name: '死线当饭吃的快枪',
    nameEn: 'Deadline Gunner',
    tagline: '越临近 deadline 手速越快，最后两小时之神。',
    colorFrom: '#ff5d8f',
    colorTo: '#ffb24d',
    emoji: '🔫',
    signalKeywords: ['fast', 'ship', 'overnight', 'speedrun', 'hack', '快', '通宵', '冲刺'],
  },
  {
    key: 'hexagon_allround',
    name: '六边形全能战士',
    nameEn: 'Hexagon All-Rounder',
    tagline: '前端后端设计路演全包，一个人就是一支队。',
    colorFrom: '#7c5dff',
    colorTo: '#ffb24d',
    emoji: '🛡️',
    signalKeywords: ['fullstack', 'solo', 'allround', 'everything', '全栈', '全能', '单干'],
  },
  {
    key: 'infra_plumber',
    name: '管道工',
    nameEn: 'Infra Plumber',
    tagline: '数据库、队列、部署管道铺得稳，半夜不报警。',
    colorFrom: '#4de1ff',
    colorTo: '#3b82f6',
    emoji: '🔧',
    signalKeywords: ['backend', 'infra', 'docker', 'k8s', 'postgres', 'redis', 'devops', 'cloud', '后端', '部署'],
  },
  {
    key: 'data_diviner',
    name: '数据占卜师',
    nameEn: 'Data Diviner',
    tagline: '从一堆原始数据里掏出洞察，图表会说话。',
    colorFrom: '#4de1ff',
    colorTo: '#34d399',
    emoji: '🔮',
    signalKeywords: ['data', 'analytics', 'pandas', 'sql', 'viz', 'dashboard', 'etl', '数据', '可视化'],
  },
  {
    key: 'chain_ronin',
    name: '链上浪人',
    nameEn: 'Chain Ronin',
    tagline: '合约、钱包、DeFi 信手拈来，链上即家。',
    colorFrom: '#c759ff',
    colorTo: '#ffb24d',
    emoji: '⛓️',
    signalKeywords: ['web3', 'solidity', 'evm', 'wallet', 'defi', 'nft', 'chain', 'crypto', '合约', '链上'],
  },
  {
    key: 'glue_integrator',
    name: '万物胶水侠',
    nameEn: 'Glue Integrator',
    tagline: '把十几个 API 编排成一个产品，集成就是超能力。',
    colorFrom: '#34d399',
    colorTo: '#7c5dff',
    emoji: '🧩',
    signalKeywords: ['api', 'integration', 'webhook', 'zapier', 'n8n', 'workflow', 'glue', '集成', '编排'],
  },
] as const;

/** 便捷查表: key → meta。实现层可直接 import 使用。 */
export const ROLE_MAP: Readonly<Record<HackathonRoleKey, HackathonRoleMeta>> =
  ROLES.reduce((acc, r) => {
    acc[r.key] = r;
    return acc;
  }, {} as Record<HackathonRoleKey, HackathonRoleMeta>);

/* =============================================================================
 * 2. 开发者配置卡
 * ========================================================================== */

/** 打法风格 */
export type PlayStyle = 'solo' | 'duo' | 'squad' | 'flexible';

/** 组队意向(裂变 pull 端核心钩子) */
export type LookingFor = 'none' | 'teammate' | 'cofounder';

/**
 * 配置卡数据。MVP 持久化 = localStorage(key: HT_IDENTITY_STORAGE_KEY)，
 * DB 持久化(扩展 users 列或新 dev_config 表)为后续，类型保持不变。
 */
export interface DevConfig {
  /** 技术栈(语言/框架)，自由 + 预置混合 */
  techStack: string[];
  /** 工具链(编辑器/终端/部署平台等) */
  tools: string[];
  /** AI 工具/模型(Claude / Cursor / Copilot ...) */
  aiTools: string[];
  /** 开发环境一句话(如 "macOS + Neovim + tmux") */
  env: string;
  /** 打法风格 */
  playStyle: PlayStyle;
  /** 擅长方向标签(如 ['AI Agent','增长','可视化']) */
  strengths: string[];
  /** 组队意向 */
  lookingFor: LookingFor;
}

/** 配置卡预置选项 — 录入表单 chips 数据源。可自由追加，不破坏类型。 */
export const DEV_CONFIG_PRESETS = {
  techStack: [
    'TypeScript', 'Python', 'Rust', 'Go', 'Solidity', 'Swift',
    'Next.js', 'React', 'Vue', 'Svelte', 'Node.js', 'FastAPI',
    'PostgreSQL', 'Tailwind CSS', 'PyTorch', 'LangChain',
  ],
  tools: [
    'VS Code', 'Neovim', 'Cursor', 'Vercel', 'Cloudflare',
    'Docker', 'GitHub', 'Figma', 'Postman', 'Supabase', 'Neon',
  ],
  aiTools: [
    'Claude', 'Claude Code', 'Cursor', 'GitHub Copilot',
    'ChatGPT', 'Gemini', 'v0', 'Windsurf', 'Perplexity', 'Codex',
  ],
  strengths: [
    'AI Agent', '全栈开发', 'UI/动效', '数据可视化', '增长/裂变',
    '后端/基础设施', 'Web3/合约', '产品/叙事', '算法/模型', 'API 集成',
  ],
} as const;

/** 打法风格展示元数据 */
export const PLAY_STYLE_META: Readonly<Record<PlayStyle, { label: string; emoji: string }>> = {
  solo: { label: '单兵作战', emoji: '🐺' },
  duo: { label: '双人小队', emoji: '👯' },
  squad: { label: '组队开黑', emoji: '🛡️' },
  flexible: { label: '都行', emoji: '🌀' },
};

/** 组队意向展示元数据(pull 端徽章用) */
export const LOOKING_FOR_META: Readonly<Record<LookingFor, { label: string; emoji: string; active: boolean }>> = {
  none: { label: '暂不组队', emoji: '😌', active: false },
  teammate: { label: '在找队友', emoji: '🤝', active: true },
  cofounder: { label: '在找联合创始人', emoji: '🚀', active: true },
};

/* =============================================================================
 * 3. 参赛履历资产
 * ========================================================================== */

/** participation.role 同源枚举 */
export type ParticipationRole = 'participant' | 'winner' | 'organizer' | 'mentor' | 'judge';

/**
 * 履历项。来源: participations join projects。
 * verified 由 project.verificationStatus === 'approved' 推导(无项目则 false)。
 */
export interface CareerItem {
  id: string;
  hackathonName: string;
  hackathonLogo?: string | null;
  /** 形如 "2025.03" 或 "2025.03–2025.04" */
  dateRange?: string | null;
  role: ParticipationRole;
  /** 名次，如 '1st' / 'finalist'，无则 null */
  placement?: string | null;
  projectName?: string | null;
  projectTagline?: string | null;
  track?: string | null;
  /** 是否已通过项目验证 */
  verified: boolean;
}

/* =============================================================================
 * 4. 聚合身份卡数据
 * ========================================================================== */

/** 统计条数据 */
export interface IdentityStats {
  projects: number;
  hackathons: number;
  awards: number;
}

/**
 * 身份卡聚合数据 — 个人主页 /u/[username]、卡片渲染、分享内容的统一输入。
 * 由 buildIdentityCardData() 从 DB 或 mock 组装；客户端只读。
 */
export interface IdentityCardData {
  username: string;
  displayName: string;
  /** 头像 URL，可空(渲染 fallback 首字母) */
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  github?: string | null;
  twitter?: string | null;
  role: RoleResult;
  config: DevConfig;
  career: CareerItem[];
  stats: IdentityStats;
  /** 社会证明计数(mock 可用，pull 端展示) */
  profileViews: number;
  /** 数据来源标记，便于 UI 显示"示例数据"角标 */
  source: 'db' | 'mock' | 'local';
}

/* =============================================================================
 * 5. 裂变分享内容
 * ========================================================================== */

/** 分享文案模板键(push 端三版文案，固定 3 个) */
export type ShareCaptionVariant = 'invite' | 'flex' | 'recruit';

/**
 * 分享内容包。captions 固定 3 条，顺序 = [invite, flex, recruit]。
 * imageUrl 指向 og 路由(优先)或客户端导出的 dataURL(降级)。
 */
export interface ShareContent {
  /** og 卡片图地址 1200x630，或客户端导出 PNG 的 object/data URL */
  imageUrl: string;
  /** 三版文案，顺序固定 [邀请式, 炫耀式, 招募式] */
  captions: [string, string, string];
  /** 被分享落地页绝对/相对 URL */
  shareUrl: string;
  /** 各文案变体的语义标签，与 captions 一一对应 */
  captionVariants?: [ShareCaptionVariant, ShareCaptionVariant, ShareCaptionVariant];
}

/* =============================================================================
 * 6. 卡片渲染契约
 * ========================================================================== */

/** 卡片类型: 角色身份卡 / 配置卡 */
export type CardVariant = 'identity' | 'config';

/** 卡片尺寸预设(og 标准社媒卡 1200x630) */
export const CARD_DIMENSIONS = { width: 1200, height: 630 } as const;

/**
 * 卡片渲染参数 — og 路由 query 与客户端预览组件 props 的共同契约。
 * og 路由从这些字段读图；预览组件直接接收同名 props，保证视觉一致。
 */
export interface CardRenderParams {
  variant: CardVariant;
  username: string;
  displayName: string;
  avatar?: string | null;
  /** 主角色 key(渲染配色与文案的核心) */
  roleKey: HackathonRoleKey;
  secondaryRoleKeys: HackathonRoleKey[];
  stats: IdentityStats;
  /** identity 卡用 career 摘要(取前 3) / config 卡用 config */
  config?: DevConfig;
  lookingFor: LookingFor;
}

/* =============================================================================
 * 常量: 存储键 / 路由 / 默认值
 * ========================================================================== */

/** localStorage 持久化键(录入页与个人主页共用) */
export const HT_IDENTITY_STORAGE_KEY = 'ht_identity_card_v1';

/** /@username rewrite 目标前缀 */
export const IDENTITY_PROFILE_BASE = '/u';

/** og 卡片路由 */
export const IDENTITY_OG_ROUTE = '/api/identity/og';

/** 空配置卡默认值(录入页初始 state) */
export const EMPTY_DEV_CONFIG: DevConfig = {
  techStack: [],
  tools: [],
  aiTools: [],
  env: '',
  playStyle: 'flexible',
  strengths: [],
  lookingFor: 'none',
};

/** 空角色结果默认值(判定前占位) */
export const DEFAULT_ROLE_RESULT: RoleResult = {
  primary: 'zero_to_one',
  secondary: [],
  manualOverride: false,
};
