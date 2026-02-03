export type Organizer = {
  name: string;
  logo?: string;
};

export type Sponsor = {
  name: string;
  logo?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
};

export type Hackathon = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  venue: string;
  dateRange: string;
  isPast: boolean;
  status: "upcoming" | "live" | "closed";
  summary: string;
  prizePool: string;
  teams: string;
  format: "offline" | "online" | "hybrid";
  theme: string;
  website: string;
  brief: string;
  tracks: { title: string; description: string }[];
  agenda: { title: string; time: string; detail: string }[];
  organizers?: Organizer[];
  sponsors?: Sponsor[];
};

export const hackathons: Hackathon[] = [
  {
    id: "seattle-build",
    name: "Pacific Northwest Build Sprint",
    shortName: "PNW Build",
    city: "Seattle, USA",
    country: "United States",
    venue: "AWS Lofts · South Lake Union",
    dateRange: "Jan 18–19",
    isPast: true,
    status: "closed",
    summary:
      "48 小时聚焦 AI + GIS 的线下黑客松，帮助城市解决公共交通和社区安全问题。",
    prizePool: "$55,000",
    teams: "64 组 / 280+ 黑客",
    format: "offline",
    theme: "AI for Public Infrastructure",
    website: "https://example.com/pnw-build",
    brief: "https://example.com/pnw-build/brief.pdf",
    tracks: [
      { title: "Transit Ops", description: "实时车流预测、路线优化、低延迟告警。" },
      { title: "Civic Safety", description: "摄像头/音频事件检测，保护隐私的联邦学习。" },
      { title: "Gov Data UX", description: "把开放数据变成好用的可视化决策面板。" },
    ],
    agenda: [
      { title: "Check-in & Teaming", time: "Sat 09:00", detail: "现场组队，快速问题抛光。" },
      { title: "Mentor Hours", time: "Sat 14:00", detail: "云原生、数据、设计三大导师桌。" },
      { title: "Overnight Build", time: "Sat 22:00", detail: "Loft 通宵开放，提供睡袋 & 夜宵。" },
      { title: "Submission", time: "Sun 13:00", detail: "GitHub 提交 + 5 min 录屏 demo。" },
      { title: "Finale", time: "Sun 16:00", detail: "Top 8 现场路演，评委现场打分。" },
    ],
    organizers: [
      { name: "AWS", logo: "/logos/aws.svg" },
      { name: "Microsoft", logo: "/logos/microsoft.svg" },
    ],
    sponsors: [
      { name: "Anthropic", logo: "/logos/anthropic.svg", tier: "gold" },
      { name: "OpenAI", logo: "/logos/openai.svg", tier: "gold" },
      { name: "Vercel", logo: "/logos/vercel.svg", tier: "silver" },
      { name: "Supabase", logo: "/logos/supabase.svg", tier: "silver" },
    ],
  },
  {
    id: "toronto-ai",
    name: "Maple Leaf AI Hack",
    shortName: "Maple AI",
    city: "Toronto, CA",
    country: "Canada",
    venue: "MaRS Discovery District",
    dateRange: "Feb 22–23",
    isPast: false,
    status: "upcoming",
    summary:
      "跨境团队共同打造生产级 AI agent，从数据接入到部署一站式完成，配套 GPU credits。",
    prizePool: "$80,000",
    teams: "70 组名额 · 现场 & 远程",
    format: "hybrid",
    theme: "Full-stack AI Agents",
    website: "https://example.com/maple-ai",
    brief: "https://example.com/maple-ai/brief.pdf",
    tracks: [
      { title: "Infra", description: "观察性、评估、成本优化，让 agent 真正可运维。" },
      { title: "Agentic UX", description: "多模态前端、语音/手势交互，提升可解释性。" },
      { title: "Verticals", description: "金融合规、跨境电商、医疗科研三大场景加速器。" },
    ],
    agenda: [
      { title: "Kickoff", time: "Sat 10:00", detail: "题目 & 评分标准解读。" },
      { title: "Infra Clinics", time: "Sat 15:00", detail: "GPU quota 分配、性能调优问诊。" },
      { title: "Checkpoint Demos", time: "Sun 09:00", detail: "录屏 90 秒，评委即时反馈。" },
      { title: "Final Pitch", time: "Sun 16:30", detail: "Top 10 Demo Day + 现场 Q&A。" },
    ],
    organizers: [
      { name: "MaRS", logo: "/logos/mars.svg" },
      { name: "Google", logo: "/logos/google.svg" },
    ],
    sponsors: [
      { name: "NVIDIA", logo: "/logos/nvidia.svg", tier: "platinum" },
      { name: "Anthropic", logo: "/logos/anthropic.svg", tier: "gold" },
      { name: "Cohere", logo: "/logos/cohere.svg", tier: "silver" },
    ],
  },
  {
    id: "berlin-quant",
    name: "Euroscope Quant Jam",
    shortName: "Quant Jam",
    city: "Berlin, DE",
    country: "Germany",
    venue: "Factory Berlin Görlitzer Park",
    dateRange: "Mar 28–29",
    isPast: false,
    status: "upcoming",
    summary:
      "量化、链上数据和高频基础设施主题，提供仿真撮合引擎与真实市场数据回测。",
    prizePool: "€65,000",
    teams: "50 组",
    format: "offline",
    theme: "On-chain + High Frequency",
    website: "https://example.com/quant-jam",
    brief: "https://example.com/quant-jam/brief.pdf",
    tracks: [
      { title: "DeFi MM", description: "自适应做市、动态对冲、MEV 风险控制。" },
      { title: "Infra", description: "撮合、风控、监控栈，毫秒级延迟优化。" },
      { title: "Analytics", description: "链上情绪与订单流结合的信号挖掘。" },
    ],
    agenda: [
      { title: "Data Drop", time: "Fri 12:00", detail: "Tick 数据 & 合约 ABI 一键获取。" },
      { title: "Checkpoints", time: "Fri 20:00", detail: "导师桌指导，技术栈评估。" },
      { title: "Backtest Window", time: "Sat 10:00", detail: "统一撮合环境，实时排行榜。" },
      { title: "Live Demo", time: "Sat 17:00", detail: "Top 6 上台，评委现场质询。" },
    ],
  },
  {
    id: "singapore-urban",
    name: "Lion City UrbanTech",
    shortName: "UrbanTech",
    city: "Singapore",
    country: "Singapore",
    venue: "Google Developer Space",
    dateRange: "May 9–10",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦可持续城市的 AIoT 创新，提供 LoRa/摄像头/环境传感器沙箱与城市数字孪生模型。",
    prizePool: "S$90,000",
    teams: "60 组",
    format: "offline",
    theme: "AIoT for Sustainable Cities",
    website: "https://example.com/urban-tech",
    brief: "https://example.com/urban-tech/brief.pdf",
    tracks: [
      { title: "Mobility", description: "多模态交通监测、拥堵预测、智慧停车。" },
      { title: "Energy", description: "微电网负载预测，楼宇能耗优化。" },
      { title: "Safety", description: "边缘检测 & 异常告警，减少误报。" },
    ],
    agenda: [
      { title: "Kickoff", time: "Fri 18:30", detail: "题目发布、规则说明。" },
      { title: "Night Build", time: "Sat 00:00", detail: "黑客通宵，设备实验室开放。" },
      { title: "Field Test", time: "Sat 10:00", detail: "带队现场部署，实时验证。" },
      { title: "Final Pitch", time: "Sat 17:30", detail: "Top 8 Demo + 评委点评。" },
    ],
  },
  {
    id: "sf-summit",
    name: "Bay Area Hacker Summit",
    shortName: "BA Summit",
    city: "San Francisco, USA",
    country: "United States",
    venue: "Fort Mason Center",
    dateRange: "Jun 20–21",
    isPast: false,
    status: "upcoming",
    summary:
      "年度旗舰黑客大会，聚焦 devtool、LLM infra、创作者经济，含一对一投资人 office hour。",
    prizePool: "$150,000",
    teams: "120 组",
    format: "offline",
    theme: "Builders, Infra, Creators",
    website: "https://example.com/ba-summit",
    brief: "https://example.com/ba-summit/brief.pdf",
    tracks: [
      { title: "DevTools", description: "下一代 DX、代码搜索、CI 可靠性。" },
      { title: "LLM Infra", description: "推理加速、数据合规、可观察性。" },
      { title: "Creator Stack", description: "新分发、版权工具、粉丝变现。" },
    ],
    agenda: [
      { title: "Registration", time: "Fri 09:00", detail: "领取徽章与福利包。" },
      { title: "Matchmaking", time: "Fri 12:00", detail: "团队与导师撮合，咖啡聊天区。" },
      { title: "Lightning Demos", time: "Sat 11:00", detail: "Top 15 上台闪电演讲。" },
      { title: "Showcase", time: "Sat 17:00", detail: "展位路演 + 评委巡展。" },
    ],
  },
  {
    id: "tokyo-robotics",
    name: "Shibuya Robotics Challenge",
    shortName: "Robotics",
    city: "Tokyo, JP",
    country: "Japan",
    venue: "Shibuya Stream Hall",
    dateRange: "Aug 15–16",
    isPast: false,
    status: "upcoming",
    summary:
      "机器人与多模态控制主题，提供移动底盘、机械臂、视觉传感器与仿真环境。",
    prizePool: "¥12,000,000",
    teams: "40 组",
    format: "offline",
    theme: "Physical AI",
    website: "https://example.com/robotics",
    brief: "https://example.com/robotics/brief.pdf",
    tracks: [
      { title: "Manipulation", description: "抓取、装箱、柔性控制的智能规划。" },
      { title: "Navigation", description: "多传感融合 SLAM，复杂地形避障。" },
      { title: "Human-robot", description: "手势/语音协作，安全共融。" },
    ],
    agenda: [
      { title: "Device Setup", time: "Fri 13:00", detail: "硬件签出与安全检查。" },
      { title: "Sim-to-Real", time: "Fri 19:00", detail: "仿真-实机过渡指导。" },
      { title: "Trials", time: "Sat 10:30", detail: "分组赛道，实时计分。" },
      { title: "Final Race", time: "Sat 16:00", detail: "Top 5 竞速决赛。" },
    ],
  },
];
