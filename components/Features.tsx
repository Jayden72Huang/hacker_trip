'use client';

import Image from 'next/image';
import { Map, Rocket, Sparkles, Trophy, Users } from 'lucide-react';
import ScrollFloat from './ScrollFloat';

// 功能模块数据 - 围绕 AI 黑客松全生命周期
const features = [
  {
    id: 'match',
    badge: '智能匹配',
    title: '别再错过适合你的 AI 黑客松',
    description: '每周全球有 50+ 场黑客松，但只有 3-5 场真正适合你。HackerTrip 分析你的技术栈、时区、奖金偏好和过往战绩，精准推送高胜率赛事。不再为选赛焦虑，把精力留给 Building。',
    // 紫色渐变
    gradientFrom: 'from-violet-600/40',
    gradientVia: 'via-purple-600/30',
    gradientTo: 'to-indigo-600/20',
    borderColor: 'border-violet-500/20',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
    image: '/images/features/discover.png',
    layout: 'left',
  },
  {
    id: 'arsenal',
    badge: 'AI 武器库',
    title: '48 小时内，你需要最强装备',
    description: '根据你的项目方向，一键获取最佳 MCP Servers、Claude Skills 和开发工具链。RAG 要用哪个向量库？Agent 框架选哪个？支付集成怎么做？别在工具选型上浪费 8 小时，我们帮你配好。',
    // 粉色渐变
    gradientFrom: 'from-rose-600/40',
    gradientVia: 'via-pink-600/30',
    gradientTo: 'to-fuchsia-600/20',
    borderColor: 'border-rose-500/20',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    image: '/images/features/personalized.png',
    layout: 'right',
  },
  {
    id: 'launch',
    badge: '产品起飞',
    title: '比赛结束才是真正的开始',
    description: '80% 的黑客松项目在颁奖后就消失了。HackerTrip 帮你持续曝光：Product Hunt 首发策略、Twitter/X 病毒式传播模板、投资人 Demo Day 对接。让你的 Weekend Project 变成下一个独角兽的起点。',
    // 琥珀色渐变
    gradientFrom: 'from-amber-600/40',
    gradientVia: 'via-orange-600/30',
    gradientTo: 'to-yellow-600/20',
    borderColor: 'border-amber-500/20',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    image: '/images/features/practical.png',
    layout: 'left',
  },
];

export function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="w-full max-w-[1240px] mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-sm font-medium text-gray-300">为什么选择 HackerTrip</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            世界第一个{' '}
            <ScrollFloat
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="top 85%"
              scrollEnd="top 50%"
              stagger={0.03}
              gradientColors={{
                from: '#818cf8',
                via: '#c084fc',
                to: '#f472b6'
              }}
            >
              黑客松 AI Agent
            </ScrollFloat>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            从发现赛事到项目落地，从工具配置到产品推广 —— 你的 AI 黑客松全程搭子
          </p>
        </div>

        {/* Feature Cards - 参考 macaron.im 风格 */}
        <div className="space-y-10">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative rounded-[32px] overflow-hidden border ${feature.borderColor} bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientVia} ${feature.gradientTo} backdrop-blur-sm hover:border-white/20 transition-all duration-500`}
            >
              <div className={`flex flex-col ${feature.layout === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} min-h-[400px]`}>

                {/* 文字区域 */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
                  <span className={`inline-block self-start px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-lg">
                    {feature.description}
                  </p>
                </div>

                {/* 图片区域 */}
                <div className="flex-1 relative min-h-[280px] lg:min-h-0 flex items-center justify-center p-4 lg:p-6">
                  <div className="relative w-full h-full max-w-[380px] max-h-[380px] group-hover:scale-[1.02] transition-transform duration-700">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Trophy, value: '50+', label: '合作黑客松', color: 'text-amber-400' },
            { icon: Map, value: '30+', label: '覆盖国家', color: 'text-emerald-400' },
            { icon: Users, value: '12K+', label: '活跃用户', color: 'text-blue-400' },
            { icon: Rocket, value: '$2M+', label: '帮助获得奖金', color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="group text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
              <stat.icon className={`w-6 h-6 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
