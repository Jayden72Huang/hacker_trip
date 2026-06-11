import Link from 'next/link';
import { preload } from 'react-dom';
import { and, asc, eq, gte, isNotNull, lte, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { Navbar } from '@/components/Navbar';
import { LogoMarquee } from '@/components/LogoMarquee';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';
import { SubscribeForm } from '@/components/SubscribeForm';
import { HackathonListSection } from '@/components/HackathonListSection';
import { OrganizerCTA } from '@/components/OrganizerCTA';
import { HeroRotatingText } from '@/components/HeroRotatingText';
import { SkillPromo } from '@/components/SkillPromo';
import { HeroVideo } from '@/components/HeroVideo';

// Event Radar 每小时重新生成，自动同步报名截止倒计时
export const revalidate = 3600;

const radarColumns = {
  id: hackathons.id,
  name: hackathons.name,
  shortName: hackathons.shortName,
  city: hackathons.city,
  location: hackathons.location,
  mode: hackathons.mode,
  theme: hackathons.theme,
  registrationDeadline: hackathons.registrationDeadline,
};

/** 已上架且报名截止在 7 天内的比赛；不足 3 个时用截止日最近的其他比赛补齐 */
async function getRadarEvents() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(today);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const open = and(
      eq(hackathons.isPublished, true),
      isNotNull(hackathons.registrationDeadline),
      gte(hackathons.registrationDeadline, today)
    );

    const rows = await db
      .select(radarColumns)
      .from(hackathons)
      .where(and(open, lte(hackathons.registrationDeadline, weekAhead)))
      .orderBy(asc(hackathons.registrationDeadline))
      .limit(3);

    if (rows.length < 3) {
      const fill = await db
        .select(radarColumns)
        .from(hackathons)
        .where(
          rows.length > 0
            ? and(open, notInArray(hackathons.id, rows.map((r) => r.id)))
            : open
        )
        .orderBy(asc(hackathons.registrationDeadline))
        .limit(3 - rows.length);
      rows.push(...fill);
    }

    return rows.map((row) => {
      const deadline = row.registrationDeadline!;
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86400000);
      return {
        id: row.id,
        date: deadline
          .toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
          .replace(',', ''),
        name: row.shortName || row.name,
        meta: [row.city || row.location || (row.mode === 'online' ? '线上' : null), row.theme]
          .filter(Boolean)
          .join(' · '),
        status: daysLeft <= 0 ? '今日截止' : daysLeft === 1 ? '明天截止' : `${daysLeft} 天后截止`,
      };
    });
  } catch {
    // DB 不可用时不阻塞首页渲染
    return [];
  }
}

export default async function Home() {
  // Hero 首屏背景是 LCP 元素，提前以最高优先级加载，避免等 CSS/JS 解析后才发现
  preload('/images/walk-loop-poster.webp', {
    as: 'image',
    fetchPriority: 'high',
    imageSrcSet:
      '/images/walk-loop-poster-640.webp 640w, /images/walk-loop-poster-960.webp 960w, /images/walk-loop-poster.webp 1280w',
    imageSizes: '100vw',
  });
  const radarEvents = await getRadarEvents();
  return (
    <div className="relative min-h-screen pb-12 overflow-hidden">
      <div className="fixed inset-0 -z-10 grid-bg opacity-35" aria-hidden />
      <div className="fixed inset-0 -z-10 noise-overlay" aria-hidden />

      <Navbar />

      <main className="pt-10">
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24 lg:pt-44">
          {/* 背景视频：主角穿行赛博朋克 AI 街道 · 无缝循环 */}
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <HeroVideo
              className="absolute inset-0 h-full w-full object-cover opacity-95 brightness-110 contrast-110 saturate-125"
              src="/videos/walk-loop.mp4"
              poster="/images/walk-loop-poster.webp"
              posterSrcSet="/images/walk-loop-poster-640.webp 640w, /images/walk-loop-poster-960.webp 960w, /images/walk-loop-poster.webp 1280w"
            />
            {/* 压暗 + 底部融入页面背景，保证文字可读 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(4,7,12,0.88) 0%, rgba(4,7,12,0.68) 38%, rgba(4,7,12,0.28) 70%, rgba(4,7,12,0.46) 100%), linear-gradient(to bottom, rgba(4,7,12,0.42) 0%, rgba(4,7,12,0.18) 42%, rgba(4,7,12,0.94) 100%)',
              }}
            />
          </div>
          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(500px,0.82fr)]">
              <div className="max-w-3xl">
                <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-purple-300/25 bg-purple-400/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-purple-300" />
                  <span className="font-space-mono text-xs font-semibold uppercase tracking-[0.24em] text-purple-100">
                    HackerTrip.Space
                  </span>
                </div>

                <h1 className="font-sora text-5xl font-extrabold leading-[0.92] tracking-tight text-white md:text-7xl lg:text-8xl">
                  你的一站式
                  <span className="mt-3 block text-purple-100">
                    黑客松 AI 平台
                  </span>
                </h1>

                <div className="mt-7 flex min-h-[3rem] flex-wrap items-center gap-4 font-sora text-xl font-semibold text-slate-100 md:text-2xl">
                  <span className="text-white">HackerTrip</span>
                  <HeroRotatingText />
                </div>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                  聚合 AI、Web3、开源与硬件赛事。输入你的项目方向，HackerTrip 帮你看赛道、截止时间、奖金池和报名路径。
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#hackathons"
                    className="inline-flex items-center justify-center rounded-xl bg-purple-500 px-6 py-3.5 font-space-mono text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition duration-300 hover:bg-purple-400 active:scale-[0.98]"
                  >
                    参加黑客松
                  </Link>
                  <Link
                    href="/organize"
                    className="inline-flex items-center justify-center rounded-xl border border-purple-200/18 bg-white/8 px-6 py-3.5 font-space-mono text-sm font-semibold text-white transition duration-300 hover:border-purple-200/32 hover:bg-purple-400/10 active:scale-[0.98]"
                  >
                    举办黑客松
                  </Link>
                  <Link
                    href="#skills"
                    className="inline-flex items-center justify-center rounded-xl border border-purple-200/18 bg-white/8 px-6 py-3.5 font-space-mono text-sm font-semibold text-white transition duration-300 hover:border-purple-200/32 hover:bg-purple-400/10 active:scale-[0.98]"
                  >
                    AI匹配
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-purple-200/18 bg-slate-950/38 p-4 shadow-2xl shadow-black/25 backdrop-blur-md">
                <div
                  className="absolute inset-0 opacity-75"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(16,8,28,0.1) 0%, rgba(7,5,13,0.84) 78%), url('/images/events-banner.webp')",
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(168,85,247,0.3),transparent_30%)]" aria-hidden />

                <div className="relative rounded-[1.5rem] border border-purple-200/14 bg-black/18 p-5">
                  <div>
                      <p className="font-space-mono text-xs uppercase tracking-[0.24em] text-purple-100">
                        Event Radar
                      </p>
                      <h2 className="mt-2 max-w-xl font-sora text-3xl font-black leading-tight text-white">
                        本周值得看的黑客松
                      </h2>
                  </div>

                  <div className="mt-6 space-y-4">
                    {radarEvents.map((event) => (
                      <Link href={`/hackathon/${event.id}`} key={event.id} className="group flex items-center gap-4 rounded-2xl border border-purple-200/14 bg-slate-950/68 p-4 backdrop-blur transition duration-300 hover:border-purple-200/35 hover:bg-slate-900/76">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-purple-100 text-slate-950">
                          <span className="font-space-mono text-[11px] font-bold uppercase leading-none">{event.date.split(' ')[0]}</span>
                          <span className="mt-1 font-space-mono text-lg font-black leading-none">{event.date.split(' ')[1]}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sora text-sm font-bold text-white">{event.name}</p>
                          <p className="mt-1 truncate text-xs text-slate-400">{event.meta}</p>
                        </div>
                        <span className="rounded-full border border-purple-200/14 bg-purple-200/[0.08] px-3 py-1 font-space-mono text-[11px] text-purple-100">
                          {event.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 flex items-center gap-3 text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              <span className="font-space-mono text-xs uppercase tracking-[0.24em]">
                AI Skill · Events · Organizer tools
                </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </section>

        {/* AI Skill 推广 */}
        <SkillPromo />

        {/* 黑客松列表（带 Tab + 搜索 + 筛选） */}
        <HackathonListSection />

        {/* Logo Marquee */}
        <LogoMarquee />

        {/* 评论走马灯 */}
        <Testimonials />

        {/* 组织者 CTA */}
        <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-16 md:py-24">
          <OrganizerCTA />
        </section>

        {/* 邮箱订阅 */}
        <section id="subscribe" className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 pb-16 md:pb-24">
          <SubscribeForm />
        </section>
      </main>

      <Footer />
    </div>
  );
}
