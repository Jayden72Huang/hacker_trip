'use client';

/**
 * ============================================================================
 *  /identity — 黑客松身份卡 入口 / 录入 / 实时预览 (核心可玩页, CSR)
 * ============================================================================
 *
 *  左录入 + 右实时预览，computeRole 实时判定角色，保存写 localStorage(免登录)，
 *  保存后出现分享内容包 ShareDock。全链路 mock，不依赖 DB / 登录。
 *
 *  深色玻璃风，复用 Navbar / Footer。
 * ============================================================================
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import IdentityWizard from '@/components/identity/IdentityWizard';

function IdentityInner() {
  const params = useSearchParams();
  const refFrom = params.get('ref');

  return <IdentityWizard refFrom={refFrom} />;
}

export default function IdentityPage() {
  return (
    <div className="min-h-screen" style={{ background: '#05060a' }}>
      <Navbar />

      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-36 lg:px-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em]"
            style={{
              color: '#4de1ff',
              background: 'rgba(77,225,255,0.05)',
              border: '1px solid rgba(77,225,255,0.15)',
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4de1ff] shadow-[0_0_6px_#4de1ff]" />
            黑客松身份卡
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            把你的隐形资产，
            <br className="hidden sm:block" />
            浓缩成一张{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(110deg,#7c5dff,#c759ff,#4de1ff)' }}
            >
              会自我传播的身份卡
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/45 leading-relaxed md:text-lg">
            角色身份 · 参赛履历 · 开发者配置 — 三合一。填 4 个字段或一键扫描，
            右侧实时生成，免登录即可保存分享。
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-20 text-center text-white/40">加载录入向导…</div>
          }
        >
          <IdentityInner />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
