import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { LogoMarquee } from '@/components/LogoMarquee';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';
import { SubscribeForm } from '@/components/SubscribeForm';
import { HackathonListSection } from '@/components/HackathonListSection';
import { OrganizerCTA } from '@/components/OrganizerCTA';
import { HeroRotatingText } from '@/components/HeroRotatingText';
import { HyperspeedHero } from '@/components/HyperspeedHero';

export default function Home() {
  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <div className="fixed inset-0 z-[-5] overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-1/5 w-[500px] h-[500px] bg-indigo-500/25 rounded-full blur-[150px]" />
        <div className="absolute top-40 right-1/5 w-[500px] h-[500px] bg-purple-500/25 rounded-full blur-[150px]" />
        <div className="absolute top-[600px] left-1/3 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[120px]" />
      </div>

      <Navbar />

      <main className="pt-10">
        {/* Hero */}
        <section className="relative pt-36 md:pt-40 lg:pt-44 pb-0 overflow-visible">
          <HyperspeedHero />
          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 text-center">
              <div className="glass rounded-full px-5 py-2.5 flex items-center gap-3 glow">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
                <span className="font-space-mono text-sm md:text-md font-medium bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  HackerTrip - 你的一站式黑客松平台
                </span>
              </div>

              <h1 className="font-sora text-3xl md:text-5xl lg:text-[3.25rem] font-extrabold leading-tight whitespace-nowrap">
                <span className="text-gray-200">
                  HackerTrip
                </span>
                {' '}
                <HeroRotatingText />
              </h1>

              <p className="font-space-mono text-base md:text-lg text-gray-400 max-w-2xl">
                汇聚全球优质黑客松活动，帮你找到最适合的比赛，轻松报名参赛
              </p>

              <div className="w-20 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shimmer" />

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link
                  href="#hackathons"
                  className="group relative px-8 py-3.5 rounded-full font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                >
                  <span className="font-space-mono text-sm">浏览黑客松</span>
                </Link>
                <Link
                  href="/organize"
                  className="group relative px-8 py-3.5 rounded-full font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                >
                  <span className="font-space-mono text-sm">发起黑客松</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

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
        <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 pb-16 md:pb-24">
          <SubscribeForm />
        </section>
      </main>

      <Footer />
    </div>
  );
}
