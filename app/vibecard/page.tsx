'use client';

import { useState } from 'react';
import Image from 'next/image';

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="ml-3 px-2.5 py-1 rounded text-xs font-mono transition-all shrink-0"
      style={{
        color: ok ? '#4de1ff' : 'rgba(255,255,255,0.35)',
        border: `1px solid ${ok ? 'rgba(77,225,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
        background: ok ? 'rgba(77,225,255,0.08)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {ok ? 'copied!' : 'copy'}
    </button>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(124,93,255,0.2))' }} />
      <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">{children}</h2>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(124,93,255,0.2))' }} />
    </div>
  );
}

export default function ViberCardPage() {
  return (
    <div className="min-h-screen relative" style={{ background: '#05060a' }}>
      {/* Background */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 25%, rgba(124,93,255,0.07), transparent 70%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-24">

        {/* ═══════════════════ Hero ═══════════════════ */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.2em] text-[#4de1ff] mb-6" style={{ border: '1px solid rgba(77,225,255,0.15)', background: 'rgba(77,225,255,0.05)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4de1ff] animate-pulse shadow-[0_0_6px_#4de1ff]" />
            Titanium Edition
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            你的 AI 协作，
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(110deg, #7c5dff 0%, #c759ff 50%, #4de1ff 100%)' }}>
              一张卡就够了
            </span>
          </h1>

          <p className="text-xl text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
            ViberCard 把你的技能、项目、DAMC 维度和 Token 消耗量
            <br className="hidden md:block" />
            浓缩成一张赛博朋克身份卡。
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              className="px-8 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(124,93,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c5dff, #c759ff)' }}
            >
              生成我的 ViberCard
            </button>
            <a
              href="#how"
              className="px-6 py-3.5 rounded-xl text-base font-medium text-white/50 transition-colors hover:text-white/80"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              了解更多
            </a>
          </div>
        </div>

        {/* ═══════════════════ Tier Cards ═══════════════════ */}
        <div className="mb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { src: '/images/vibecard_bronze.png', tier: 'Bronze', level: 'Lv.10', color: '#CD7F32', desc: '入门战士 · 青铜锻压' },
              { src: '/images/vibecard_gold.png', tier: 'Gold', level: 'Lv.25', color: '#FFD700', desc: '成就解锁 · 24K 黄金' },
              { src: '/images/vibecard_platinum.png', tier: 'Platinum', level: 'Lv.50', color: '#E5E4E2', desc: '精英玩家 · 铂金激光' },
              { src: '/images/vibecard_diamond.png', tier: 'Diamond', level: 'Lv.99', color: '#b9f2ff', desc: '传奇存在 · 全息钻石' },
            ].map((card) => (
              <div key={card.tier} className="relative group">
                <div aria-hidden className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-12 opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: `${card.color}30`, filter: 'blur(24px)', borderRadius: '50%' }} />
                <div className="rounded-2xl overflow-hidden transition-transform group-hover:scale-[1.02]" style={{ border: `1px solid ${card.color}20`, background: 'rgba(0,0,0,0.3)' }}>
                  <Image
                    src={card.src}
                    alt={`ViberCard ${card.tier}`}
                    width={1536}
                    height={1024}
                    className="w-full h-auto"
                  />
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono" style={{ color: card.color }}>{card.tier}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: card.color, background: `${card.color}15`, border: `1px solid ${card.color}25` }}>{card.level}</span>
                    </div>
                    <span className="text-xs text-white/25">{card.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════ Quick Start ═══════════════════ */}
        <section className="mb-28">
          <SectionTitle>快速开始</SectionTitle>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,93,255,0.12)', background: 'rgba(0,0,0,0.5)' }}>
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="ml-3 text-xs font-mono text-white/20">terminal</span>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* CLI command */}
              <div className="flex items-center">
                <span className="text-[#4de1ff] font-mono text-base mr-3">$</span>
                <code className="text-base font-mono text-white/80">npx hackertrip vibecard generate</code>
                <CopyBtn text="npx hackertrip vibecard generate" />
              </div>

              <div className="text-sm font-mono text-white/20 pl-7">
                # 或在 Claude Code / Cursor 中输入 Skill 命令：
              </div>

              {/* Skill command */}
              <div className="flex items-center">
                <span className="text-[#c759ff] font-mono text-base mr-3">&gt;</span>
                <code className="text-base font-mono text-white/80">/hackertrip-card</code>
                <CopyBtn text="/hackertrip-card" />
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-white/20 mt-5 font-mono">
            数据来自你的 HackerTrip 账户 · 本地生成 · 隐私安全
          </p>
        </section>

        {/* ═══════════════════ How It Works ═══════════════════ */}
        <section id="how" className="mb-28">
          <SectionTitle>如何使用</SectionTitle>

          <div className="space-y-6">
            {[
              {
                n: '01',
                color: '#7c5dff',
                title: '生成你的 ViberCard',
                desc: '在终端运行 CLI，或在 AI Agent 中输入 Skill。系统自动从你的账户抓取真实数据 — 技能、项目、DAMC 维度、Token 消耗。',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                n: '02',
                color: '#c759ff',
                title: '发现赛事 & 智能匹配队友',
                desc: 'AI 根据你的 DAMC 维度和技能标签，推荐最合适的黑客松赛事，并匹配技能互补的队友。不再盲找，精准组队。',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                n: '03',
                color: '#4de1ff',
                title: '分享 & Agent 自动组队',
                desc: '把 ViberCard 分享到 X 或发给潜在队友。开启 Agent 模式后，你的 Agent 可以代替你自动协商组队 — 全程无需手动操作。',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-6 p-7 rounded-2xl transition-colors hover:border-white/10"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono"
                    style={{ background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}30` }}
                  >
                    {step.n}
                  </span>
                  <span style={{ color: step.color }} className="opacity-60">{step.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-base text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ What's on Your Card ═══════════════════ */}
        <section className="mb-28">
          <SectionTitle>卡片包含什么</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: '📊',
                title: 'DAMC 四维画像',
                desc: 'Design · Analyze · Market · Code — 量化你的 builder 能力分布',
                accent: '#7c5dff',
              },
              {
                icon: '⚡',
                title: 'Token 消耗量',
                desc: '累计 AI Token 使用量 — 你与 AI 深度协作的证明',
                accent: '#4de1ff',
              },
              {
                icon: '🛠',
                title: '技能 & 技术栈',
                desc: '自动提取你擅长的框架和语言，形成标签矩阵',
                accent: '#c759ff',
              },
              {
                icon: '🏆',
                title: '参赛 & 组队数据',
                desc: '黑客松次数、组队数、连胜记录、匹配分 — 一目了然',
                accent: '#ff6b9d',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ All CLI Commands ═══════════════════ */}
        <section className="mb-28">
          <SectionTitle>CLI 命令一览</SectionTitle>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,93,255,0.12)', background: 'rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="ml-3 text-xs font-mono text-white/20">hackertrip cli</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {[
                { cmd: 'ht vibecard generate', desc: '生成你的 ViberCard' },
                { cmd: 'ht hackathons --upcoming', desc: '发现即将开始的赛事' },
                { cmd: 'ht team-search --skills react,python', desc: '搜索技能互补的队友' },
                { cmd: 'ht recommend', desc: 'AI 个性化推荐赛事和项目' },
                { cmd: 'ht messages list', desc: '查看私信和组队邀请' },
              ].map((item) => (
                <div key={item.cmd} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-[#4de1ff] font-mono text-base mr-3">$</span>
                    <code className="text-base font-mono text-white/75">{item.cmd}</code>
                  </div>
                  <span className="text-sm text-white/25 hidden sm:block">{item.desc}</span>
                </div>
              ))}

              <div className="px-6 py-4" style={{ background: 'rgba(199,89,255,0.03)' }}>
                <div className="text-xs font-mono text-white/20 mb-3">Claude Code / Cursor Skill：</div>
                <div className="space-y-2.5">
                  {[
                    { cmd: '/hackertrip-card', desc: '生成 ViberCard' },
                    { cmd: '/hackertrip-collect', desc: '收集黑客松信息' },
                  ].map((item) => (
                    <div key={item.cmd} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-[#c759ff] font-mono text-base mr-3">&gt;</span>
                        <code className="text-base font-mono text-white/75">{item.cmd}</code>
                      </div>
                      <span className="text-sm text-white/25 hidden sm:block">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ Bottom CTA ═══════════════════ */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好了吗？</h2>
          <p className="text-lg text-white/30 mb-8">一条命令，生成属于你的 ViberCard。</p>

          <div
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl font-mono text-base mb-6"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(124,93,255,0.15)' }}
          >
            <span className="text-[#4de1ff]">$</span>
            <span className="text-white/80">npx hackertrip vibecard generate</span>
            <CopyBtn text="npx hackertrip vibecard generate" />
          </div>

          <p className="text-xs text-white/15 font-mono">
            HackerTrip © 2024 · Open Source · Built with AI
          </p>
        </section>

      </div>
    </div>
  );
}
