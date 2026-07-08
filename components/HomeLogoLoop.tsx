'use client';

import LogoLoop, { type LogoItem } from './LogoLoop';

/**
 * 合作社区 logos（已针对深色背景处理：去白底/深色字转白）
 * 源图在 合作社区logo/ 目录，处理后统一放 public/logos/
 * 新增合作方时补充 { src, alt, href? } 即可
 */
const communityLogos: LogoItem[] = [
  { src: '/logos/hackquest.png', alt: 'HackQuest', title: 'HackQuest', width: 415, height: 120 },
  { src: '/logos/oraclevibesolver.png', alt: 'OracleVibeSolver', title: 'OracleVibeSolver', width: 568, height: 120 },
  { src: '/logos/voxhacker.png', alt: 'VoxHacker 声浪客', title: 'VoxHacker 声浪客', width: 320, height: 120 },
  { src: '/logos/medo.png', alt: '秒哒', title: '秒哒', width: 220, height: 64 },
  { src: '/logos/miaoda-hackathon.png', alt: '秒哒应用美学黑客松', title: '秒哒应用美学黑客松', width: 384, height: 120 },
];

/** 首页「AI 匹配项目」模块下方的合作社区 Logo 无限滚动带 */
export function HomeLogoLoop() {
  return (
    <section className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-10 md:py-14">
      <p className="mb-8 text-center font-space-mono text-xs uppercase tracking-[0.24em] text-slate-500">
        合作社区 · Community Partners
      </p>
      <LogoLoop
        logos={communityLogos}
        speed={80}
        direction="left"
        logoHeight={40}
        gap={88}
        hoverSpeed={0.2}
        scaleOnHover
        fadeOut
        fadeOutColor="#05060a"
        ariaLabel="合作社区 logos"
      />
    </section>
  );
}
