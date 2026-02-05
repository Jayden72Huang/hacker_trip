'use client';

import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ExternalLink, Sparkles, Users, Zap } from 'lucide-react';

// 合作方数据
const partners = [
  {
    name: 'ETHGlobal',
    logo: 'https://ethglobal.com/favicon.ico',
    description: '全球最大的以太坊黑客松组织',
    url: 'https://ethglobal.com',
  },
  {
    name: 'Devpost',
    logo: 'https://devpost.com/assets/favicon-e12e35b96deec364e7dc7fb3589b0f22db6b154852c7ff7167e42f2f5f3da2e8.ico',
    description: '全球黑客松平台',
    url: 'https://devpost.com',
  },
  {
    name: 'MLH',
    logo: 'https://mlh.io/favicon.ico',
    description: 'Major League Hacking',
    url: 'https://mlh.io',
  },
  {
    name: 'DoraHacks',
    logo: 'https://dorahacks.io/favicon.ico',
    description: '去中心化黑客松平台',
    url: 'https://dorahacks.io',
  },
];

// 支持的 AI 工具
const aiTools = [
  {
    name: 'Claude',
    logo: '/ai-tools/claude.svg',
    description: 'Anthropic 旗舰 AI 助手',
    url: 'https://claude.ai',
    color: 'from-orange-500/20 to-amber-500/20',
  },
  {
    name: 'ChatGPT',
    logo: '/ai-tools/openai.svg',
    description: 'OpenAI 对话式 AI',
    url: 'https://chat.openai.com',
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    name: 'Cursor',
    logo: '/ai-tools/cursor.svg',
    description: 'AI 驱动的代码编辑器',
    url: 'https://cursor.sh',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    name: 'v0',
    logo: '/ai-tools/v0.svg',
    description: 'Vercel AI UI 生成器',
    url: 'https://v0.dev',
    color: 'from-gray-500/20 to-slate-500/20',
  },
  {
    name: 'Bolt',
    logo: '/ai-tools/bolt.svg',
    description: 'StackBlitz AI 全栈开发',
    url: 'https://bolt.new',
    color: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    name: 'Lovable',
    logo: '/ai-tools/lovable.svg',
    description: 'AI 应用生成平台',
    url: 'https://lovable.dev',
    color: 'from-pink-500/20 to-rose-500/20',
  },
  {
    name: 'Windsurf',
    logo: '/ai-tools/windsurf.svg',
    description: 'Codeium AI IDE',
    url: 'https://codeium.com/windsurf',
    color: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    name: 'Replit',
    logo: '/ai-tools/replit.svg',
    description: 'AI 协作编程平台',
    url: 'https://replit.com',
    color: 'from-orange-500/20 to-red-500/20',
  },
  {
    name: 'GitHub Copilot',
    logo: '/ai-tools/copilot.svg',
    description: 'AI 配对编程助手',
    url: 'https://github.com/features/copilot',
    color: 'from-purple-500/20 to-violet-500/20',
  },
  {
    name: 'Perplexity',
    logo: '/ai-tools/perplexity.svg',
    description: 'AI 搜索引擎',
    url: 'https://perplexity.ai',
    color: 'from-teal-500/20 to-emerald-500/20',
  },
  {
    name: 'Midjourney',
    logo: '/ai-tools/midjourney.svg',
    description: 'AI 图像生成',
    url: 'https://midjourney.com',
    color: 'from-indigo-500/20 to-purple-500/20',
  },
  {
    name: 'Stability AI',
    logo: '/ai-tools/stability.svg',
    description: 'Stable Diffusion 开发者',
    url: 'https://stability.ai',
    color: 'from-violet-500/20 to-fuchsia-500/20',
  },
];

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Users size={16} className="text-indigo-400" />
              <span className="font-space-mono text-sm text-indigo-300">Community</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                构建未来的
              </span>
              <br />
              <span className="text-white">黑客松生态</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              与全球顶尖黑客松平台合作，集成最先进的 AI 开发工具，
              为开发者提供最佳的创新体验。
            </p>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="py-16">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI 工具生态</h2>
              <p className="text-sm text-gray-500">支持的 AI 开发工具与平台</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aiTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${tool.color} border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{tool.name[0]}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-center gap-1">
                      {tool.name}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Zap size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">合作伙伴</h2>
              <p className="text-sm text-gray-500">全球黑客松平台与社区</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 rounded-2xl glass border border-white/5 hover:border-indigo-500/30 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{partner.name[0]}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                      {partner.name}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-gray-500">{partner.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                想要成为合作伙伴？
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                如果你是黑客松组织者、AI 工具开发者或社区运营者，
                欢迎与我们合作，共同推动开发者生态发展。
              </p>
              <a
                href="mailto:Jayden0702work@outlook.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.03] font-medium"
              >
                联系我们
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
