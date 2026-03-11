'use client';

import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

type FeatureCard = {
  id: string;
  title: string;
  subtitle: string;
  features: string[];
  emoji: string;
  accentColor: string;
  borderColor: string;
  icon: React.ReactNode;
};

const cards: FeatureCard[] = [
  {
    id: 'team-matching',
    title: 'AI 组队助手',
    subtitle: '智能匹配最佳队友',
    features: ['技能互补分析', '实时在线匹配', '团队化学反应评分'],
    emoji: '🤝',
    accentColor: 'text-purple-400',
    borderColor: 'hover:border-purple-500/40',
    icon: <GroupsIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'ai-mentor',
    title: 'AI 导师',
    subtitle: '24/7 陪伴式指导',
    features: ['赛题深度解析', '技术方案建议', 'Code Review 助手'],
    emoji: '🧙‍♂️',
    accentColor: 'text-cyan-400',
    borderColor: 'hover:border-cyan-500/40',
    icon: <AutoAwesomeIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'project-booster',
    title: '项目加速器',
    subtitle: '从 0 到 Demo 只需 24h',
    features: ['Starter Kit 库', '设计素材包', '一键部署方案'],
    emoji: '⚡',
    accentColor: 'text-amber-400',
    borderColor: 'hover:border-amber-500/40',
    icon: <RocketLaunchIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'showcase',
    title: '作品展示台',
    subtitle: '让你的项目被看见',
    features: ['自动生成 Demo 视频', 'VC 推荐引擎', '获奖作品集锦'],
    emoji: '🏆',
    accentColor: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/40',
    icon: <EmojiEventsIcon sx={{ fontSize: 24 }} />,
  },
];

const keywords = [
  'Hackathon', 'Web3', 'AI Agent', 'DeFi', 'NFT', 'DAO',
  'LLM', 'Solidity', 'Next.js', 'React', 'Rust', 'ZK Proof',
  'AIGC', 'MCP', 'RAG', 'Fine-tuning', 'Smart Contract', 'dApp',
];

/**
 * 社区功能展示 - 关键词墙 + 功能卡片网格
 */
export function CommunityCarousel() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 space-y-12">
      {/* 关键词墙 */}
      <div className="flex flex-wrap justify-center gap-3">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200 cursor-default select-none"
          >
            {keyword}
          </span>
        ))}
      </div>

      {/* 功能卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`group p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 ${card.borderColor} transition-all duration-300 hover:bg-white/[0.04]`}
          >
            <div className="flex items-start gap-4">
              {/* Emoji */}
              <div className="text-4xl flex-shrink-0">{card.emoji}</div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={card.accentColor}>{card.icon}</span>
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{card.subtitle}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {card.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-gray-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
