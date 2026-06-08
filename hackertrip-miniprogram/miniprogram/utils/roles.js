/**
 * 角色判定 —— 从官网 lib/identity/{roles,types,captions}.ts 忠实移植到小程序。
 * 纯函数、零副作用，供「卡片工坊」与「扫描结果」复用。
 * 权重规则与官网一致（IDENTITY-DESIGN.md §5）。
 */

const ROLES = [
  { key: 'zero_to_one', name: '从零到一搭建者', tagline: '空白仓库到可运行 Demo，48 小时一把梭。', colorFrom: '#7c5dff', colorTo: '#4de1ff', emoji: '🚀', signalKeywords: ['mvp', 'prototype', 'scaffold', 'fullstack', 'next', 'demo', '从零', '搭建'] },
  { key: 'model_alchemist', name: '深不见底炼丹师', tagline: '调参、微调、RAG，把模型炼成想要的形状。', colorFrom: '#c759ff', colorTo: '#7c5dff', emoji: '🧪', signalKeywords: ['llm', 'ai', 'ml', 'rag', 'finetune', 'pytorch', 'agent', 'embedding', '模型', '炼丹'] },
  { key: 'pixel_carver', name: '像素级雕花匠', tagline: '动效、留白、对齐到 1px，颜值即正义。', colorFrom: '#4de1ff', colorTo: '#c759ff', emoji: '🎨', signalKeywords: ['ui', 'ux', 'tailwind', 'figma', 'framer', 'css', 'animation', 'design', '设计', '动效'] },
  { key: 'narrative_god', name: '一页封神叙事者', tagline: '一页 PPT 一段 Demo，把评委讲到鼓掌。', colorFrom: '#ff7eb6', colorTo: '#7c5dff', emoji: '🎤', signalKeywords: ['pitch', 'story', 'deck', 'demo', 'present', 'narrative', '叙事', '路演', '故事'] },
  { key: 'deadline_gunner', name: '死线当饭吃的快枪', tagline: '越临近 deadline 手速越快，最后两小时之神。', colorFrom: '#ff5d8f', colorTo: '#ffb24d', emoji: '🔫', signalKeywords: ['fast', 'ship', 'overnight', 'speedrun', 'hack', '快', '通宵', '冲刺'] },
  { key: 'hexagon_allround', name: '六边形全能战士', tagline: '前端后端设计路演全包，一个人就是一支队。', colorFrom: '#7c5dff', colorTo: '#ffb24d', emoji: '🛡️', signalKeywords: ['fullstack', 'solo', 'allround', 'everything', '全栈', '全能', '单干'] },
  { key: 'infra_plumber', name: '管道工', tagline: '数据库、队列、部署管道铺得稳，半夜不报警。', colorFrom: '#4de1ff', colorTo: '#3b82f6', emoji: '🔧', signalKeywords: ['backend', 'infra', 'docker', 'k8s', 'postgres', 'redis', 'devops', 'cloud', '后端', '部署'] },
  { key: 'data_diviner', name: '数据占卜师', tagline: '从一堆原始数据里掏出洞察，图表会说话。', colorFrom: '#4de1ff', colorTo: '#34d399', emoji: '🔮', signalKeywords: ['data', 'analytics', 'pandas', 'sql', 'viz', 'dashboard', 'etl', '数据', '可视化'] },
  { key: 'chain_ronin', name: '链上浪人', tagline: '合约、钱包、DeFi 信手拈来，链上即家。', colorFrom: '#c759ff', colorTo: '#ffb24d', emoji: '⛓️', signalKeywords: ['web3', 'solidity', 'evm', 'wallet', 'defi', 'nft', 'chain', 'crypto', '合约', '链上'] },
  { key: 'glue_integrator', name: '万物胶水侠', tagline: '把十几个 API 编排成一个产品，集成就是超能力。', colorFrom: '#34d399', colorTo: '#7c5dff', emoji: '🧩', signalKeywords: ['api', 'integration', 'webhook', 'zapier', 'n8n', 'workflow', 'glue', '集成', '编排'] },
];

const ROLE_MAP = ROLES.reduce((acc, r) => { acc[r.key] = r; return acc; }, {});

const DEFAULT_ROLE_RESULT = { primary: 'zero_to_one', secondary: [], scores: [], manualOverride: false };

const PLAY_STYLE_META = {
  solo: { label: '单兵作战', emoji: '🐺' },
  duo: { label: '双人小队', emoji: '👯' },
  squad: { label: '组队开黑', emoji: '🛡️' },
  flexible: { label: '都行', emoji: '🌀' },
};

const LOOKING_FOR_META = {
  none: { label: '暂不组队', emoji: '😌', active: false },
  teammate: { label: '在找队友', emoji: '🤝', active: true },
  cofounder: { label: '在找联合创始人', emoji: '🚀', active: true },
};

const TECH_CATEGORY_KEYWORDS = {
  frontend: ['react', 'vue', 'svelte', 'next', 'nuxt', 'tailwind', 'css', 'html', 'vite', 'typescript', 'javascript'],
  backend: ['node', 'fastapi', 'express', 'django', 'flask', 'go', 'rust', 'java', 'spring', 'graphql', 'grpc'],
  ai: ['llm', 'ai', 'ml', 'pytorch', 'tensorflow', 'langchain', 'openai', 'rag', 'embedding', 'agent', 'transformers'],
  data: ['pandas', 'sql', 'postgres', 'duckdb', 'spark', 'analytics', 'etl', 'numpy', 'bigquery'],
  web3: ['solidity', 'web3', 'evm', 'ethers', 'wallet', 'defi', 'nft', 'foundry', 'hardhat', 'wagmi'],
  design: ['figma', 'framer', 'design', 'motion', 'animation', 'ui', 'ux'],
  infra: ['docker', 'k8s', 'kubernetes', 'redis', 'cloudflare', 'vercel', 'aws', 'devops', 'terraform', 'nginx'],
  mobile: ['swift', 'kotlin', 'flutter', 'react native', 'expo', 'android', 'ios'],
};

function countTechCategories(techStack) {
  const hit = new Set();
  for (const raw of techStack) {
    const t = raw.toLowerCase();
    for (const cat of Object.keys(TECH_CATEGORY_KEYWORDS)) {
      if (TECH_CATEGORY_KEYWORDS[cat].some((kw) => t.includes(kw))) hit.add(cat);
    }
  }
  return hit.size;
}

function matchKeywords(haystack, needles) {
  const joined = haystack.join(' ');
  const hits = [];
  for (const n of needles) {
    if (joined.includes(n.toLowerCase())) hits.push(n);
  }
  return hits;
}

/**
 * decideRole — 角色判定。
 * @param {object} signals { techStack[], taglineKeywords[], participantRoles[], projectCount, winCount, shippingVelocity }
 * @param {string|null} manualOverride 手动锁定主角色
 */
function decideRole(signals, manualOverride) {
  const techStack = (signals.techStack || []).map((s) => String(s).toLowerCase());
  const taglineKeywords = (signals.taglineKeywords || []).map((s) => String(s).toLowerCase());
  const participantRoles = (signals.participantRoles || []).map((s) => String(s).toLowerCase());
  const projectCount = signals.projectCount || 0;
  const winCount = signals.winCount || 0;
  const velocity = signals.shippingVelocity || 0;
  const techCategoryCount = countTechCategories(techStack);

  const scoreMap = {};
  ROLES.forEach((role) => { scoreMap[role.key] = { key: role.key, score: 0, reasons: [] }; });
  const add = (key, delta, reason) => {
    const s = scoreMap[key];
    if (!s) return;
    s.score += delta;
    s.reasons.push(reason);
  };

  ROLES.forEach((role) => {
    const techHits = matchKeywords(techStack, role.signalKeywords);
    if (techHits.length) add(role.key, techHits.length * 3, `技术栈命中 ${techHits.join('/')}`);
    const tagHits = matchKeywords(taglineKeywords, role.signalKeywords);
    if (tagHits.length) add(role.key, tagHits.length * 2, `项目描述命中 ${tagHits.join('/')}`);
  });

  if (winCount > 0) {
    add('narrative_god', winCount * 2, `${winCount} 次获奖，叙事/路演能力突出`);
    add('deadline_gunner', winCount * 2, `${winCount} 次获奖，临场交付能力强`);
  }
  if (projectCount >= 3) add('zero_to_one', 4, `已交付 ${projectCount} 个项目，从零搭建经验丰富`);
  if (techCategoryCount >= 3) add('hexagon_allround', 5, `技术栈横跨 ${techCategoryCount} 个领域，全能型选手`);
  if (participantRoles.includes('organizer') || participantRoles.includes('judge')) add('narrative_god', 2, '担任过组织者/评委，叙事掌控力强');
  if (velocity >= 1.2) add('deadline_gunner', 4, `平均每场交付 ${velocity.toFixed(1)} 个项目，手速惊人`);

  const scores = Object.keys(scoreMap).map((k) => scoreMap[k]).sort((a, b) => b.score - a.score);
  const top = scores[0];

  if (!top || top.score <= 0) {
    if (manualOverride) return { primary: manualOverride, secondary: [], scores, manualOverride: true };
    return Object.assign({}, DEFAULT_ROLE_RESULT, { scores });
  }
  if (manualOverride) {
    const secondary = scores.filter((s) => s.key !== manualOverride && s.score > 0).slice(0, 2).map((s) => s.key);
    return { primary: manualOverride, secondary, scores, manualOverride: true };
  }
  const primary = top.key;
  const secondary = scores.filter((s) => s.key !== primary && s.score > 0).slice(0, 2).map((s) => s.key);
  return { primary, secondary, scores, manualOverride: false };
}

/** 生成三版分享文案 [invite, flex, recruit]（与官网 captions.ts 一致） */
function buildShareCaptions(data, shareUrl) {
  const role = ROLE_MAP[data.role] || ROLE_MAP.zero_to_one;
  const lf = LOOKING_FOR_META[data.lookingFor || 'none'];
  const top3 = (data.techStack || []).slice(0, 3).join(' / ') || '全栈';
  const invite = `我在黑客松里是「${role.name}」${role.emoji}，看看你是什么角色 → ${shareUrl}`;
  const flex = `${data.hackathons || 0} 场黑客松 · ${data.awards || 0} 次获奖，这是我的选手身份卡 👉 ${shareUrl}`;
  const recruit = lf.active
    ? `${lf.label}${lf.emoji}，技术栈 ${top3}，来组队 → ${shareUrl}`
    : `技术栈 ${top3}，这是我的开发者配置卡 → ${shareUrl}`;
  return [invite, flex, recruit];
}

module.exports = {
  ROLES,
  ROLE_MAP,
  DEFAULT_ROLE_RESULT,
  PLAY_STYLE_META,
  LOOKING_FOR_META,
  decideRole,
  buildShareCaptions,
};
