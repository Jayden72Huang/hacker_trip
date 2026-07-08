import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { CopyButton } from './CopyButton';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export const metadata: Metadata = {
  title: 'HackerTrip CLI + Skills — 选手发作品，主办方发赛事',
  description:
    'HackerTrip 命令行工具与 Claude Code skills：选手扫描本地项目匹配黑客松、一条命令发布作品到个人主页；主办方丢一张海报即可提交赛事，审核后网站与小程序双端分发。',
  alternates: {
    canonical: `${siteUrl}/cli`,
  },
  keywords: [
    'HackerTrip CLI',
    '黑客松 CLI',
    'Claude Code skills',
    '黑客松作品发布',
    '黑客松赛事提交',
    'hackathon CLI',
  ],
};

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <code className="overflow-x-auto whitespace-pre font-mono text-sm leading-6 text-cyan-100/90">
        {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}

function StepCard({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm text-cyan-200">
          {index}
        </span>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <div className="space-y-3 text-sm leading-7 text-slate-300">{children}</div>
    </div>
  );
}

export default function CliPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Navbar />

      <main className="mx-auto w-full max-w-[980px] px-6 pb-24 pt-32 lg:px-10">
        <article className="space-y-14">
          {/* Hero */}
          <header className="space-y-6">
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-cyan-200/80">
              HackerTrip CLI + Skills
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
              终端里的黑客松入口
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">
              一套开源命令行工具 + Claude Code skills：选手扫描本地项目找比赛、一条命令把作品发到个人主页；主办方丢一张海报就能提交赛事，审核后在网站与微信小程序双端触达选手。
            </p>
            <CommandBlock command="npx hackertrip --help" />
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href="https://www.npmjs.com/package/hackertrip"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-200/90 underline decoration-cyan-200/40 underline-offset-4 transition hover:text-cyan-100"
              >
                npm: hackertrip ↗
              </a>
              <a
                href="https://github.com/Jayden72Huang/hackertrip-cli"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-200/90 underline decoration-cyan-200/40 underline-offset-4 transition hover:text-cyan-100"
              >
                GitHub 源码 ↗
              </a>
            </div>
          </header>

          {/* 角色导航 */}
          <nav className="grid gap-4 md:grid-cols-2">
            <a
              href="#player"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-6 transition hover:border-cyan-300/40"
            >
              <p className="text-2xl">🎒</p>
              <h2 className="mt-2 text-lg font-bold text-white">我是选手</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                找比赛、发作品、沉淀个人主页作品集
              </p>
            </a>
            <a
              href="#organizer"
              className="rounded-2xl border border-amber-200/20 bg-amber-200/5 p-6 transition hover:border-amber-200/40"
            >
              <p className="text-2xl">📣</p>
              <h2 className="mt-2 text-lg font-bold text-white">我是主办方</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                提交赛事、跟踪审核、双端分发触达选手
              </p>
            </a>
          </nav>

          {/* 选手 */}
          <section id="player" className="scroll-mt-28 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white md:text-3xl">🎒 选手：三步发布你的作品</h2>
              <p className="text-sm leading-7 text-slate-400">
                全程不需要账号密码——靠小程序生成的一次性配对码（30 分钟失效）鉴权，repo 扫描 100% 在本地完成。
              </p>
            </div>

            <div className="grid gap-4">
              <StepCard index={1} title="安装 CLI">
                <CommandBlock command="npm i -g hackertrip" />
                <p>
                  需要 Node.js ≥ 18。想先找比赛？在项目目录里跑{' '}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-cyan-100">
                    hackertrip match
                  </code>
                  ，AI 会按你的技术栈匹配最适合的黑客松。
                </p>
              </StepCard>

              <StepCard index={2} title="小程序生成配对码">
                <p>
                  打开 HackerTrip 微信小程序 → <strong className="text-white">我的 → Skills 同步 → 生成配对码</strong>
                  ，得到 6 位配对码和同步凭证，按页面提示设置环境变量。
                </p>
              </StepCard>

              <StepCard index={3} title="一条命令发布作品">
                <CommandBlock
                  command={`hackertrip publish-work \\
  --pair-code 你的配对码 \\
  --demo "https://your.demo.app" \\
  --awards "2026 AdventureX 最佳人气奖"`}
                />
                <p>
                  项目名、技术栈、描述、仓库地址会自动从 repo 扫出来，你只补机器抓不到的。发布后回小程序{' '}
                  <strong className="text-white">我的 → 作品</strong> 预览确认，点『发布』即公开到个人主页。
                </p>
              </StepCard>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-6">
              <h3 className="text-base font-bold text-white">⚡ 让 AI 帮你跑全程</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                装好选手 skill 后，在 Claude Code 里直接说「帮我把作品发到 HackerTrip」，AI 会自动扫描、追问补全、自检格式、执行发布。
              </p>
              <div className="mt-3">
                <CommandBlock command="npx hackertrip install-skills --player" />
              </div>
            </div>
          </section>

          {/* 主办方 */}
          <section id="organizer" className="scroll-mt-28 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white md:text-3xl">📣 主办方：三步提交你的赛事</h2>
              <p className="text-sm leading-7 text-slate-400">
                提交进入绑定账号的草稿箱，平台人工审核后上架——审核通过即在 hackertrip.space 与微信小程序双端展示。
              </p>
            </div>

            <div className="grid gap-4">
              <StepCard index={1} title="安装 CLI">
                <CommandBlock command="npm i -g hackertrip" />
              </StepCard>

              <StepCard index={2} title="小程序生成提交码">
                <p>
                  打开 HackerTrip 微信小程序 → <strong className="text-white">主办方后台 → 生成提交码</strong>
                  （需先通过组织者认证），提交会绑定到你的主办方账号。
                </p>
              </StepCard>

              <StepCard index={3} title="提交赛事">
                <CommandBlock
                  command={`hackertrip submit-event \\
  --pair-code 你的提交码 \\
  --name "AdventureX 2026 黑客松" \\
  --city "杭州" \\
  --start 2026-07-25 --end 2026-07-27 \\
  --website "https://adventure-x.org"`}
                />
                <p>
                  必填四件套：<strong className="text-white">名称 + 起止时间 + 城市 + 官网</strong>
                  。奖金、日期不确定就留空，不要编造——提交经过准入门槛与格式双层校验。
                </p>
              </StepCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/5 p-6">
                <h3 className="text-base font-bold text-white">⚡ 丢一张海报给 AI</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  装好主办方 skill 后，把活动海报图丢给 Claude 说「帮我把这个黑客松发到 HackerTrip」，AI 自动 OCR 整理字段并提交。
                </p>
                <div className="mt-3">
                  <CommandBlock command="npx hackertrip install-skills --organizer" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-base font-bold text-white">📡 跟踪审核状态</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  提交后随时在终端查询审核进度、待补充项和审核备注。
                </p>
                <div className="mt-3">
                  <CommandBlock command="hackertrip event-status --pair-code 你的提交码" />
                </div>
              </div>
            </div>
          </section>

          {/* 安全说明 */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-bold text-white">🔐 配对码与安全</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
              <li>· 全程不需要账号密码，靠小程序生成的一次性配对码 + 凭证鉴权</li>
              <li>· 配对码 30 分钟一次性失效，泄露风险极低</li>
              <li>· 选手 repo 扫描在本地完成，只上传你确认要发布的字段</li>
              <li>· 作品同步后处于「待审核」，必须本人在小程序预览确认才公开</li>
            </ul>
          </section>

          <footer className="text-center text-sm text-slate-400">
            开源共建：
            <a
              href="https://github.com/Jayden72Huang/hackertrip-cli"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-200/90 underline decoration-cyan-200/40 underline-offset-4"
            >
              GitHub
            </a>
            {' '}· 找比赛先逛{' '}
            <Link
              href="/explore"
              className="text-cyan-200/90 underline decoration-cyan-200/40 underline-offset-4"
            >
              赛事列表
            </Link>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
