'use client';

import { useState } from 'react';
import {
  Bot,
  ChevronRight,
  Rocket,
  Users,
  Zap,
  Search,
  BarChart3,
  Lightbulb,
  Presentation,
  Sparkles,
} from 'lucide-react';

interface OnboardingWizardProps {
  userName: string;
  onComplete: (data: { teamName: string; hackathonId?: string }) => void;
}

const skills = [
  {
    cmd: '/analyze',
    label: '赛题分析',
    desc: '深度解析赛题规则和评分标准',
    icon: BarChart3,
    gradient: 'from-[#4de1ff] to-[#7c5dff]',
    border: 'border-[#4de1ff]/30',
    bg: 'bg-[#4de1ff]/5',
    dot: 'bg-[#4de1ff]',
  },
  {
    cmd: '/brainstorm',
    label: '创意脑暴',
    desc: '苏格拉底式对话激发灵感',
    icon: Lightbulb,
    gradient: 'from-amber-400 to-orange-500',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    dot: 'bg-amber-400',
  },
  {
    cmd: '/plan',
    label: '项目规划',
    desc: '任务拆解、分工和时间线',
    icon: Rocket,
    gradient: 'from-[#7c5dff] to-[#c759ff]',
    border: 'border-[#7c5dff]/30',
    bg: 'bg-[#7c5dff]/5',
    dot: 'bg-[#7c5dff]',
  },
  {
    cmd: '/resources',
    label: '资源发现',
    desc: '搜索开源项目和框架工具',
    icon: Search,
    gradient: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/5',
    dot: 'bg-emerald-400',
  },
  {
    cmd: '/pitch',
    label: '路演准备',
    desc: 'Pitch Deck 和 Demo 脚本',
    icon: Presentation,
    gradient: 'from-[#c759ff] to-pink-500',
    border: 'border-[#c759ff]/30',
    bg: 'bg-[#c759ff]/5',
    dot: 'bg-[#c759ff]',
  },
];

export function OnboardingWizard({
  userName,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState(`${userName}'s Team`);
  const [isCreating, setIsCreating] = useState(false);

  const handleFinish = async () => {
    setIsCreating(true);
    await onComplete({ teamName });
  };

  return (
    <div className="relative flex flex-col h-full bg-[#05060a] items-center justify-center p-8 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#7c5dff]/[0.06] blur-[100px] animate-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[#4de1ff]/[0.05] blur-[100px] animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#c759ff]/[0.04] blur-[120px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-40" />
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-5">
          {/* Logo with glow ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5dff] via-[#c759ff] to-[#4de1ff] opacity-40 blur-xl animate-pulse-ring" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c5dff] via-[#c759ff] to-[#4de1ff] flex items-center justify-center shadow-lg shadow-[#7c5dff]/30 animate-float-slow">
              <Bot size={30} className="text-white drop-shadow-md" />
            </div>
          </div>

          {/* Title with gradient text */}
          <div className="text-center space-y-2">
            <h1 className="font-sora text-2xl font-bold bg-gradient-to-r from-white via-white to-[#4de1ff] bg-clip-text text-transparent">
              Welcome to Haki
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-500 text-sm">Powered by</span>
              <span className="text-sm font-space-mono font-medium bg-gradient-to-r from-[#7c5dff] to-[#c759ff] bg-clip-text text-transparent">
                OpenClaw
              </span>
              <Sparkles size={12} className="text-[#c759ff]" />
            </div>
            <p className="text-gray-500 text-sm">
              你的黑客松 AI 数字队友，准备好一起冲了吗？
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step
                  ? 'w-10 bg-gradient-to-r from-[#7c5dff] to-[#4de1ff]'
                  : i < step
                    ? 'w-5 bg-[#7c5dff]/50'
                    : 'w-5 bg-white/[0.08]'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[280px]">
          {/* ── Step 0: Create Team ── */}
          {step === 0 && (
            <div
              key="step-0"
              className="space-y-6 animate-fade-up"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c5dff]/10 border border-[#7c5dff]/20 text-[#7c5dff] text-xs font-space-mono">
                  <Users size={14} /> Step 1 · 创建团队
                </div>
                <p className="text-gray-400 text-sm">
                  给你的黑客松团队起个名字
                </p>
              </div>

              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="输入团队名称..."
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#7c5dff]/50 focus:ring-1 focus:ring-[#7c5dff]/20 focus:bg-white/[0.06] transition-all duration-300"
                autoFocus
              />

              <button
                onClick={() => setStep(1)}
                disabled={!teamName.trim()}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#7c5dff] to-[#c759ff] text-white font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#7c5dff]/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                继续
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          )}

          {/* ── Step 1: Learn Skills ── */}
          {step === 1 && (
            <div
              key="step-1"
              className="space-y-6 animate-fade-up"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c759ff]/10 border border-[#c759ff]/20 text-[#c759ff] text-xs font-space-mono">
                  <Zap size={14} /> Step 2 · 了解技能
                </div>
                <p className="text-gray-400 text-sm">
                  Haki 拥有 5 个专业技能
                </p>
              </div>

              <div className="space-y-2.5">
                {skills.map((skill, index) => {
                  const Icon = skill.icon;
                  return (
                    <div
                      key={skill.cmd}
                      className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl ${skill.bg} border ${skill.border} hover:bg-white/[0.04] transition-all duration-300`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      {/* Colored dot */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
                      >
                        <Icon size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-space-mono text-white/80">
                            {skill.cmd}
                          </code>
                          <span className="text-[10px] text-gray-600">
                            {skill.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5 truncate">
                          {skill.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#7c5dff] to-[#c759ff] text-white font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#7c5dff]/25"
              >
                继续
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          )}

          {/* ── Step 2: Ready ── */}
          {step === 2 && (
            <div
              key="step-2"
              className="space-y-6 animate-fade-up"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4de1ff]/10 border border-[#4de1ff]/20 text-[#4de1ff] text-xs font-space-mono">
                  <Rocket size={14} /> Step 3 · 准备就绪
                </div>
                <p className="text-gray-400 text-sm">
                  一切就绪，开始你的黑客松之旅！
                </p>
              </div>

              {/* Summary card with glass effect */}
              <div className="p-5 rounded-2xl glass space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-space-mono uppercase tracking-wider">
                    Team
                  </span>
                  <span className="text-white text-sm font-semibold">
                    {teamName}
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-space-mono uppercase tracking-wider">
                    Engine
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5dff] animate-pulse" />
                    <span className="text-[#7c5dff] text-xs font-space-mono">
                      OpenClaw + Claude
                    </span>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-space-mono uppercase tracking-wider">
                    Skills
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Mini skill dots */}
                    <div className="flex -space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4de1ff] border border-[#05060a]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#05060a]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7c5dff] border border-[#05060a]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#05060a]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#c759ff] border border-[#05060a]" />
                    </div>
                    <span className="text-white text-xs">5 已就绪</span>
                  </div>
                </div>
              </div>

              {/* Launch button */}
              <button
                onClick={handleFinish}
                disabled={isCreating}
                className="group relative w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-white font-medium text-sm transition-all duration-300 overflow-hidden disabled:opacity-60"
              >
                {/* Button gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c5dff] via-[#c759ff] to-[#4de1ff]" />
                {/* Shimmer overlay */}
                {!isCreating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-full animate-[shimmer_2.8s_infinite]" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      开始冲
                      <Rocket
                        size={16}
                        className="transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]"
                      />
                    </>
                  )}
                </span>
              </button>

              {/* Footer note */}
              <p className="text-center text-[11px] text-gray-600">
                输入 <code className="text-[#7c5dff] font-space-mono">/help</code> 随时查看可用命令
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
