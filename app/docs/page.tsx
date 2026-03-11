import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Compass, FileText, MessageSquareText, ShieldAlert } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import {
  buildPlatformSupportPrompt,
  conciergeBlueprint,
  docsSections,
  faqGroups,
  guardrails,
  knowledgeSources,
  platformKnowledgeOverview,
  starterQuestions,
  supportedTasks,
} from '@/data/platform-assistant';

export const metadata: Metadata = {
  title: 'HackerTrip Docs · AI 客服与帮助中心',
  description:
    '了解 HackerTrip 的 AI 智能客服如何帮助用户发现黑客松、参与赛事、推广项目，以及主办方、赞助商和合作伙伴如何使用平台。',
};

const quickLinks = [
  { title: '发现黑客松', href: '/' },
  { title: '进入社区', href: '/community' },
  { title: '查看作品榜', href: '/products' },
  { title: '发起黑客松', href: '/organize' },
];

export default function DocsPage() {
  const supportPrompt = buildPlatformSupportPrompt();

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <div className="fixed inset-0 z-[-5] overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute left-[8%] top-28 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[150px]" />
        <div className="absolute right-[10%] top-40 h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="pt-34 md:pt-38">
        <section className="mx-auto w-full max-w-[1440px] px-6 lg:px-10">
          <div className="glass overflow-hidden rounded-[34px] border border-white/8">
            <div className="grid gap-8 border-b border-white/10 px-6 py-8 md:px-8 lg:grid-cols-[1fr_320px] lg:px-10">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2">
                  <Bot size={15} className="text-cyan-300" />
                  <span className="font-space-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                    Creator Guide
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="font-space-mono text-xs uppercase tracking-[0.3em] text-gray-500">
                    Quickstart / AI Concierge
                  </p>
                  <h1 className="max-w-4xl font-sora text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    设计一个真正懂黑客松生态的 AI 智能客服
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-gray-300 md:text-lg">
                    这套帮助中心把 AI 客服的人设、知识边界、Q&A 和站点说明统一到一个文档层里。
                    它专门服务 HackerTrip 的平台使用场景，不回答代码问题，只帮助用户更快地发现、
                    参与和放大黑客松价值。
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Tracked Hackathons"
                    value={String(platformKnowledgeOverview.totalHackathons)}
                    detail="已整理进平台的数据样本"
                  />
                  <MetricCard
                    label="Ecosystem Orgs"
                    value={String(platformKnowledgeOverview.organizerCount)}
                    detail="主办方 / 合作方信息线索"
                  />
                  <MetricCard
                    label="Sponsors"
                    value={String(platformKnowledgeOverview.sponsorCount)}
                    detail="可用于客服介绍的赞助品牌"
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <MessageSquareText size={18} className="text-cyan-300" />
                  <div>
                    <p className="font-sora text-lg font-semibold text-white">Ask AI</p>
                    <p className="text-sm text-gray-500">示例问题</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  {starterQuestions.map((question) => (
                    <div
                      key={question}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-10 px-6 py-8 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)_260px] lg:px-10">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-space-mono text-xs uppercase tracking-[0.24em] text-gray-500">
                    Navigation
                  </p>
                  <nav className="mt-4 flex flex-col gap-2">
                    {docsSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              <article className="min-w-0 space-y-10">
                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                    Assistant Blueprint
                  </p>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">
                    {conciergeBlueprint.name}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-gray-300">
                    {conciergeBlueprint.mission}
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <InfoListCard title="服务对象" items={conciergeBlueprint.audience} />
                    <InfoListCard title="回答风格" items={conciergeBlueprint.tone} />
                  </div>
                </section>

                {docsSections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8"
                  >
                    <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-gray-500">
                      {section.kicker}
                    </p>
                    <h2 className="mt-3 font-sora text-3xl font-semibold text-white">{section.title}</h2>
                    <p className="mt-4 text-base leading-8 text-gray-300">{section.summary}</p>

                    {section.steps && (
                      <div className="mt-6 space-y-3">
                        {section.steps.map((step, index) => (
                          <div
                            key={step}
                            className="flex gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-space-mono text-sm text-cyan-200">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-7 text-gray-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.bullets && (
                      <div className="mt-6 grid gap-3">
                        {section.bullets.map((bullet) => (
                          <div
                            key={bullet}
                            className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-7 text-gray-300"
                          >
                            {bullet}
                          </div>
                        ))}
                      </div>
                    )}

                    {section.callout && (
                      <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4">
                        <p className="text-sm leading-7 text-amber-50/90">{section.callout}</p>
                      </div>
                    )}
                  </section>
                ))}

                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-gray-500">
                    Knowledge Scope
                  </p>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">
                    AI 客服可用数据源
                  </h2>
                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-left">
                      <thead className="bg-white/[0.04]">
                        <tr className="text-sm text-gray-400">
                          <th className="px-4 py-4 font-medium">来源</th>
                          <th className="px-4 py-4 font-medium">内容</th>
                          <th className="px-4 py-4 font-medium">客服使用方式</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm text-gray-300">
                        {knowledgeSources.map((source) => (
                          <tr key={source.title} className="align-top">
                            <td className="px-4 py-4 font-medium text-white">{source.title}</td>
                            <td className="px-4 py-4 leading-7">{source.description}</td>
                            <td className="px-4 py-4 leading-7 text-gray-400">{source.scope}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-gray-500">
                    Supported Flows
                  </p>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">推荐的用户任务流</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {supportedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-3xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                            <Compass size={18} />
                          </div>
                          <h3 className="font-sora text-xl font-semibold text-white">{task.title}</h3>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-gray-300">{task.summary}</p>
                        <p className="mt-4 font-space-mono text-xs uppercase tracking-[0.2em] text-gray-500">
                          Example prompt
                        </p>
                        <div className="mt-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-gray-400">
                          {task.prompts[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-gray-500">
                    Q&A Library
                  </p>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">预置客服问答</h2>
                  <div className="mt-6 space-y-5">
                    {faqGroups.map((group) => (
                      <div key={group.title} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                        <div className="mb-4">
                          <h3 className="font-sora text-2xl font-semibold text-white">{group.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-gray-400">{group.description}</p>
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) => (
                            <details
                              key={item.question}
                              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                            >
                              <summary className="cursor-pointer list-none font-sora text-base font-medium text-white marker:hidden">
                                {item.question}
                              </summary>
                              <p className="mt-3 text-sm leading-7 text-gray-300">{item.answer}</p>
                            </details>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={18} className="text-amber-300" />
                    <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-amber-200">
                      Guardrails
                    </p>
                  </div>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">客服边界</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {guardrails.map((rule) => (
                      <div
                        key={rule.title}
                        className="rounded-3xl border border-amber-300/10 bg-amber-400/8 p-5"
                      >
                        <h3 className="font-sora text-lg font-semibold text-white">{rule.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-gray-300">{rule.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(18,25,40,0.95),rgba(10,12,22,0.95))] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-cyan-300" />
                    <p className="font-space-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                      System Prompt
                    </p>
                  </div>
                  <h2 className="mt-3 font-sora text-3xl font-semibold text-white">可直接接入模型的客服提示词</h2>
                  <pre className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-black/30 p-5 text-sm leading-7 whitespace-pre-wrap text-gray-300">
                    {supportPrompt}
                  </pre>
                </section>
              </article>

              <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-space-mono text-xs uppercase tracking-[0.24em] text-gray-500">
                    On This Page
                  </p>
                  <div className="mt-4 space-y-2">
                    {docsSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-space-mono text-xs uppercase tracking-[0.24em] text-gray-500">
                    Next Steps
                  </p>
                  <div className="mt-4 space-y-3">
                    {quickLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-gray-300 transition-colors hover:border-cyan-300/20 hover:text-white"
                      >
                        <span>{item.title}</span>
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-space-mono text-xs uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className="mt-3 font-sora text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{detail}</p>
    </div>
  );
}

function InfoListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-sora text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-gray-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
