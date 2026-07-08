'use client';

import { useState } from 'react';
import { Check, Copy, ScanLine, Shield, Sparkles, Terminal } from 'lucide-react';

export function SkillPromo() {
  const [copied, setCopied] = useState(false);
  const installCmd = 'curl -sfL hackertrip.space/install | bash';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="skills" className="w-full max-w-[1440px] mx-auto scroll-mt-24 px-4 py-10 md:px-6 md:py-20 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#071018]">
        <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/40" aria-hidden />

        <div className="relative grid gap-8 p-5 md:grid-cols-[0.82fr_1fr] md:p-10 lg:p-14">
          {/* Left - Info */}
          <div className="flex flex-col justify-between gap-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5">
                  <Sparkles size={14} className="text-cyan-200" />
                  <span className="font-space-mono text-xs font-semibold uppercase tracking-wider text-cyan-100">AI Skill</span>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="font-space-mono text-xs text-slate-400">开源免费 · 本地运行</span>
                </div>
              </div>

              <h2 className="mt-6 font-sora text-2xl font-bold leading-tight text-white md:text-4xl">
                一行命令，让 AI 读懂你的项目，再匹配可参赛的黑客松
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
                装到 Claude Code、Cursor 或 Windsurf。它会读取 package.json、README 和目录结构，输出推荐赛事、匹配分、赛道建议和 Pitch 角度。
              </p>
            </div>

            {/* Install command - mobile only (shown inline) */}
            <div className="rounded-2xl border border-white/[0.1] bg-black/35 md:hidden">
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all font-space-mono text-xs text-cyan-100">
                    <span className="text-slate-500">$ </span>{installCmd}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 transition-colors hover:bg-white/10"
                    title="复制命令"
                  >
                    {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} className="text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Steps - compact on mobile */}
            <div className="flex flex-col gap-7 md:gap-8">
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-bold text-cyan-100">1</div>
                <div>
                  <p className="text-base font-semibold text-white">终端安装 Skill</p>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-500 md:block">10 秒内装到本机，不需要上传代码</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-bold text-cyan-100">2</div>
                <div>
                  <p className="text-base font-semibold text-white">进入你的项目目录</p>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-500 md:block">支持 JS/TS、Python、Rust、Go、Ruby、Flutter</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-bold text-cyan-100">3</div>
                <div>
                  <p className="text-base font-semibold text-white">输入 <code className="rounded bg-white/10 px-2 py-1 font-space-mono text-sm text-cyan-100">/ht-scan-project</code></p>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-500 md:block">自动生成 Top 5 推荐和报名路径</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <Shield size={12} className="text-emerald-300" />
              <span>100% 本地运行，代码不上传</span>
            </div>
          </div>

          {/* Right - Terminal (desktop only) */}
          <div className="hidden flex-col gap-4 md:flex">
            {/* Install command */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-black/35">
              <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                <Terminal size={16} className="text-slate-500" />
                <span className="text-xs font-mono text-slate-500">Terminal</span>
                <span className="ml-auto flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-100">install</span>
                </span>
              </div>
              <div className="p-4">
                <p className="mb-2 font-space-mono text-xs text-slate-500">安装（10秒）</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all font-space-mono text-sm text-cyan-100">
                    <span className="text-slate-500">$ </span>{installCmd}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
                    title="复制命令"
                  >
                    {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} className="text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Scan result preview */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/35">
              <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                <ScanLine size={16} className="text-cyan-100" />
                <span className="ml-1 font-space-mono text-xs text-slate-500">/ht-scan-project 效果预览</span>
              </div>
              <div className="space-y-3 p-4 font-space-mono text-xs leading-relaxed">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-cyan-300/25 bg-cyan-300/10 text-[10px] font-bold text-cyan-100">1</span>
                    <p className="text-white">项目画像</p>
                  </div>
                  <p className="ml-3 text-slate-500">名称：my-ai-app</p>
                  <p className="ml-3 text-slate-500">技术栈：Next.js, Claude SDK, Three.js</p>
                  <p className="ml-3 text-slate-500">领域：AI Application Platform</p>
                </div>
                <div className="border-t border-white/[0.08] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-cyan-300/25 bg-cyan-300/10 text-[10px] font-bold text-cyan-100">2</span>
                    <p className="text-cyan-100">匹配结果</p>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-cyan-100">#1 AdventureX 2026</span>
                      <span className="text-amber-200">92/100</span>
                    </div>
                    <p className="ml-3 text-slate-500">推荐赛道：AI 应用创新</p>
                    <div className="flex justify-between">
                      <span className="text-cyan-100">#2 腾讯云黑客松·总决赛</span>
                      <span className="text-amber-200">87/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-100">#3 BEYOND HACK DAY</span>
                      <span className="text-amber-200">81/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-100">详情+报名 → hackertrip.space/hackathon/...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
