export type Project = {
  id: string;
  name: string;
  tagline: string;
  coverImage?: string;
  hackathonId: string;
  hackathonName: string;
  hackathonSlug: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  likes: number;
  views: number;
  hotScore: number;
  tracks: string[];
  techStack: string[];
  awards?: {
    title: string;
    tier: 'champion' | 'runner-up' | 'finalist' | 'special';
    prize?: string;
  }[];
  demoUrl?: string;
  repoUrl?: string;
  videoUrl?: string;
};

export const projects: Project[] = [
  {
    id: 'p-1',
    name: 'Transit Whisperer',
    tagline: 'LLM 预测城市拥堵并推送动态出行建议',
    coverImage: '/projects/transit.jpg',
    hackathonId: 'seattle-build',
    hackathonName: 'Pacific Northwest Build Sprint',
    hackathonSlug: 'seattle-build',
    user: { id: 'u-1', name: 'Ada Chen', avatar: '/avatars/ada.png', title: 'Full-stack' },
    likes: 420,
    views: 3200,
    hotScore: 96,
    tracks: ['Transit Ops'],
    techStack: ['Next.js', 'Python', 'OpenAI'],
    awards: [{ title: 'Overall Champion', tier: 'champion', prize: '$15,000' }],
    demoUrl: 'https://demo.transitwhisperer.ai',
    repoUrl: 'https://github.com/demo/transit-whisperer',
  },
  {
    id: 'p-2',
    name: 'Civic Sentinel',
    tagline: '多模态摄像头异常检测，低误报守护社区',
    coverImage: '/projects/civic.jpg',
    hackathonId: 'seattle-build',
    hackathonName: 'Pacific Northwest Build Sprint',
    hackathonSlug: 'seattle-build',
    user: { id: 'u-2', name: 'Leo Xu', avatar: '/avatars/leo.png', title: 'ML Engineer' },
    likes: 310,
    views: 2100,
    hotScore: 78,
    tracks: ['Civic Safety'],
    techStack: ['PyTorch', 'Edge TPU'],
    awards: [{ title: 'Best Safety Track', tier: 'runner-up', prize: '$8,000' }],
    demoUrl: 'https://sentinel.city',
  },
  {
    id: 'p-3',
    name: 'Atlas Agents',
    tagline: '跨境团队的全栈 AI Agent DevOps',
    coverImage: '/projects/atlas.jpg',
    hackathonId: 'toronto-ai',
    hackathonName: 'Maple Leaf AI Hack',
    hackathonSlug: 'toronto-ai',
    user: { id: 'u-3', name: 'Mina Patel', avatar: '/avatars/mina.png', title: 'Product Engineer' },
    likes: 520,
    views: 4100,
    hotScore: 99,
    tracks: ['Infra', 'Agentic UX'],
    techStack: ['LangGraph', 'Supabase', 'Vercel'],
    awards: [{ title: 'Best Infra', tier: 'champion', prize: '$20,000' }],
    demoUrl: 'https://atlasagents.dev',
    repoUrl: 'https://github.com/demo/atlas-agents',
    videoUrl: 'https://youtu.be/demo-atlas',
  },
  {
    id: 'p-4',
    name: 'QuantForge',
    tagline: '链上高频做市策略仿真与自动对冲',
    coverImage: '/projects/quant.jpg',
    hackathonId: 'berlin-quant',
    hackathonName: 'Euroscope Quant Jam',
    hackathonSlug: 'berlin-quant',
    user: { id: 'u-4', name: 'Jonas Müller', avatar: '/avatars/jonas.png', title: 'Quant Dev' },
    likes: 280,
    views: 2600,
    hotScore: 83,
    tracks: ['DeFi MM'],
    techStack: ['Rust', 'Solana', 'JAX'],
    awards: [{ title: 'Finalist', tier: 'finalist', prize: '€5,000' }],
  },
  {
    id: 'p-5',
    name: 'Urban Twin',
    tagline: '城市数字孪生 + LoRa 传感融合实时能耗优化',
    coverImage: '/projects/urban.jpg',
    hackathonId: 'singapore-urban',
    hackathonName: 'Lion City UrbanTech',
    hackathonSlug: 'singapore-urban',
    user: { id: 'u-5', name: 'Fiona Lim', avatar: '/avatars/fiona.png', title: 'IoT Engineer' },
    likes: 190,
    views: 1800,
    hotScore: 71,
    tracks: ['Energy', 'Mobility'],
    techStack: ['LoRa', 'Three.js', 'Python'],
  },
  {
    id: 'p-6',
    name: 'Creator Pulse',
    tagline: '创作者经济的一键分发与粉丝洞察',
    coverImage: '/projects/creator.jpg',
    hackathonId: 'sf-summit',
    hackathonName: 'Bay Area Hacker Summit',
    hackathonSlug: 'sf-summit',
    user: { id: 'u-6', name: 'Kate Morris', avatar: '/avatars/kate.png', title: 'Front-end' },
    likes: 610,
    views: 5200,
    hotScore: 102,
    tracks: ['Creator Stack'],
    techStack: ['Next.js', 'Prisma', 'OpenAI'],
    awards: [{ title: 'Audience Choice', tier: 'special', prize: '$7,500' }],
  },
];
