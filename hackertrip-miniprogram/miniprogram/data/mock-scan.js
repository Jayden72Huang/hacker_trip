/**
 * 本地 mock：演示「Skills 同步」落地效果。
 * 真实数据由 CLI(/ht-scan-project) 或网页端扫描后，经云函数 pairSync 推送，
 * 结构与此一致。云开发未配置时用它演示同步成功后的展示。
 */
module.exports = {
  syncedAt: 1733500000000,
  source: 'ht-scan-project (mock)',
  project: {
    name: 'my-ai-app',
    domain: 'AI Application Platform',
    techStack: ['Next.js', 'Claude SDK', 'TypeScript', 'Three.js', 'Tailwind'],
    summary: '一个基于 Claude 的多智能体应用平台，含 3D 可视化与实时协作。',
  },
  // 角色判定结果（用于一键生成身份卡）
  identity: {
    role: 'model_alchemist',
    secondary: ['zero_to_one', 'pixel_carver'],
    techStack: ['Next.js', 'Claude SDK', 'TypeScript', 'Three.js', 'Tailwind'],
    playStyle: 'solo',
    lookingFor: 'teammate',
    hackathons: 4,
    awards: 1,
    projects: 6,
  },
  // Top5 黑客松匹配
  matches: [
    { hackathonId: 'ht-00', name: '春潮 Spring｜深圳黑客松', score: 92, track: 'AI 应用创新', pitch: '你的多智能体平台契合「软件社交」赛道，3D 可视化是路演加分项。' },
    { hackathonId: 'ht-01', name: 'AdventureX 2026', score: 88, track: 'AI Agent', pitch: 'Claude SDK 多智能体编排正中 Agent 赛道核心命题。' },
    { hackathonId: 'ht-02', name: 'BEYOND HACK DAY', score: 83, track: '创作工具', pitch: '实时协作 + AI 生成，适合做成创作者生产力工具。' },
    { hackathonId: 'ht-03', name: '腾讯云 AI 黑客松', score: 79, track: '云原生应用', pitch: '可结合腾讯云能力做云端推理，补齐基础设施叙事。' },
    { hackathonId: 'ht-04', name: '出海 Hackathon', score: 74, track: '出海工具', pitch: 'AI 应用平台天然适合做多语言出海版本。' },
  ],
};
