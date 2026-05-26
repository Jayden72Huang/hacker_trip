'use client';

import { useState } from 'react';
import { Check, Copy, Scan, Sparkles, Zap, Shield, Terminal } from 'lucide-react';

export function SkillPromo() {
  const [copied, setCopied] = useState(false);
  const installCmd = 'curl -sfL hackertrip.space/install | bash';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-16 md:py-24">
      <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-12 lg:p-16">
          {/* Left - Info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles size={14} className="text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">AI Skill</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-gray-400">开源免费</span>
              </div>
            </div>

            <h2 className="font-sora text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
              一行命令
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI 帮你匹配黑客松
              </span>
            </h2>

            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              在 AI 编程助手中输入 <code className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 text-sm font-mono">/ht-scan-project</code>，自动扫描你的项目代码，语义匹配最适合参加的黑客松比赛。
            </p>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { icon: Scan, label: '深度扫描', desc: '分析技术栈和项目领域' },
                { icon: Zap, label: '语义匹配', desc: 'AI 理解项目做什么' },
                { icon: Shield, label: '本地运行', desc: '代码不会上传' },
                { icon: Terminal, label: '6款助手', desc: 'Claude · Cursor · Windsurf' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Icon size={18} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Terminal */}
          <div className="flex flex-col gap-4">
            {/* Install command */}
            <div className="rounded-2xl bg-[#1a1a2e] border border-white/[0.08] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-gray-500 font-mono">Terminal</span>
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs font-mono mb-2">安装（10秒）</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-cyan-300 text-sm font-mono break-all">
                    <span className="text-gray-500">$ </span>{installCmd}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    title="复制命令"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Scan result preview */}
            <div className="rounded-2xl bg-[#1a1a2e] border border-white/[0.08] overflow-hidden flex-1">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-gray-500 font-mono">/ht-scan-project 效果预览</span>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed space-y-3">
                <div>
                  <p className="text-white">📦 项目画像</p>
                  <p className="text-gray-500 ml-3">名称：my-ai-app</p>
                  <p className="text-gray-500 ml-3">技术栈：Next.js, Claude SDK, Three.js</p>
                  <p className="text-gray-500 ml-3">领域：AI Application Platform</p>
                </div>
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-yellow-400">🎯 匹配结果</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">#1 AdventureX 2026</span>
                      <span className="text-yellow-400">92/100</span>
                    </div>
                    <p className="text-gray-500 ml-3">推荐赛道：AI 应用创新</p>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">#2 腾讯云黑客松·总决赛</span>
                      <span className="text-yellow-400">87/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">#3 BEYOND HACK DAY</span>
                      <span className="text-yellow-400">81/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-purple-400 text-[11px]">📋 详情+报名 → hackertrip.space/hackathon/...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
