import Link from 'next/link';
import { Bot, Compass, Megaphone, PartyPopper, ShieldCheck } from 'lucide-react';
import {
  conciergeBlueprint,
  platformKnowledgeOverview,
  starterQuestions,
  supportedTasks,
} from '@/data/platform-assistant';

const icons = {
  discover: Compass,
  join: Bot,
  prepare: ShieldCheck,
  promote: Megaphone,
  organize: PartyPopper,
};

export function AIConciergeSection() {
  return (
    <section className="relative py-24">
      <div className="w-full max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="glass rounded-[36px] border border-white/10 overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] p-8 md:p-10 lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2">
                <Bot size={16} className="text-cyan-300" />
                <span className="font-space-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                  AI Concierge
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="max-w-2xl font-sora text-3xl font-bold leading-tight text-white md:text-5xl">
                  为 HackerTrip 设计的站点级 AI 智能客服
                </h2>
                <p className="max-w-2xl text-base leading-7 text-gray-300 md:text-lg">
                  {conciergeBlueprint.tagline} 它专注回答平台用途、赛事信息、赞助商与合作生态、
                  参赛路径和项目推广，不触碰代码与内部实现。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-space-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                    Active Signals
                  </p>
                  <p className="mt-3 font-sora text-3xl font-semibold text-white">
                    {platformKnowledgeOverview.upcomingHackathons}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">重点关注中的黑客松活动</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-space-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                    Sponsor Network
                  </p>
                  <p className="mt-3 font-sora text-3xl font-semibold text-white">
                    {platformKnowledgeOverview.sponsorCount}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">已沉淀的赞助品牌线索</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-space-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                    Coverage
                  </p>
                  <p className="mt-3 font-sora text-3xl font-semibold text-white">
                    {platformKnowledgeOverview.cityCoverage}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">已覆盖的城市活动样本</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-gray-500">
                  What It Handles
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {supportedTasks.map((task) => {
                    const Icon = icons[task.id as keyof typeof icons] ?? Bot;

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-cyan-300/30 hover:bg-white/[0.04]"
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                          <Icon size={18} />
                        </div>
                        <h3 className="font-sora text-lg font-semibold text-white">{task.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-400">{task.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,34,0.9),rgba(8,11,18,0.95))] p-6 shadow-[0_30px_80px_rgba(7,12,24,0.45)]">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-cyan-500/20">
                    <Bot size={20} />
                  </div>
                  <div>
                    <p className="font-sora text-lg font-semibold text-white">{conciergeBlueprint.name}</p>
                    <p className="font-space-mono text-xs uppercase tracking-[0.18em] text-gray-500">
                      Platform-only knowledge mode
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-5">
                  {starterQuestions.map((question) => (
                    <div
                      key={question}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300"
                    >
                      {question}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4">
                  <p className="font-space-mono text-xs uppercase tracking-[0.2em] text-amber-200">
                    Guardrail
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-50/90">
                    仅回答平台、赛事、赞助与合作信息；不提供代码、数据库或内部实现说明。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 font-space-mono text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
                >
                  查看帮助中心
                </Link>
                <Link
                  href="/hacker-bot"
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 font-space-mono text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  进入 Hacker Bot
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
