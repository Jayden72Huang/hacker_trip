import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { HelpCenter } from './HelpCenter';

export const metadata: Metadata = {
  title: 'HackerTrip 帮助中心',
  description:
    '了解如何使用 HackerTrip 发现黑客松、报名参赛、推广项目，以及主办方如何发起和管理活动。',
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <div className="fixed inset-0 z-[-5] overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute left-[8%] top-28 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[150px]" />
        <div className="absolute right-[10%] top-40 h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-[150px]" />
      </div>

      <Navbar />

      <main className="pt-34 md:pt-38">
        <section className="mx-auto w-full max-w-[1100px] px-6 lg:px-10">
          <HelpCenter />
        </section>
      </main>

      <Footer />
    </div>
  );
}
