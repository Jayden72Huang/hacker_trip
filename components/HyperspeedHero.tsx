'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), { ssr: false });

const heroOptions = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 35,
  lightPairsPerRoadWay: 70,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.15, 0.6] as [number, number],
  lightStickHeight: [1.4, 1.9] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.05, 400 * 0.25] as [number, number],
  carLightsRadius: [0.07, 0.18] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.8, 0.8] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x050610,
    islandColor: 0x05060a,
    background: 0x05060a,
    shoulderLines: 0x1a1a2e,
    brokenLines: 0x15152a,
    leftCars: [0x7c5dff, 0xc759ff, 0x9b6bff],
    rightCars: [0x4de1ff, 0x00b5ff, 0x6ee7ff],
    sticks: 0x4de1ff,
  },
};

const maskImage =
  'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 15%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 85%)';

// 移动端 GPU 较弱，WebGL 跑道场景每次挂载都要重建几何体 + 重新编译 Bloom shader，
// 导致从详情页返回首页时卡顿 1-2 秒。移动端改用纯 CSS 渐变光效降级，桌面端保留原效果。
function HeroFallbackGradient() {
  return (
    <div
      className="absolute inset-x-0 top-0 z-0 opacity-65"
      style={{ bottom: 0, maskImage, WebkitMaskImage: maskImage }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 100%, rgba(124,93,255,0.28) 0%, rgba(77,225,255,0.16) 35%, rgba(5,6,10,0) 70%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'conic-gradient(from 180deg at 50% 120%, rgba(199,89,255,0.18), rgba(77,225,255,0.18), rgba(124,93,255,0.18), rgba(199,89,255,0.18))',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}

export function HyperspeedHero() {
  const [mode, setMode] = useState<'pending' | 'webgl' | 'fallback'>('pending');

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMode(mql.matches || reducedMotion ? 'fallback' : 'webgl');
  }, []);

  // SSR / 首次客户端渲染前先用轻量降级背景，避免布局抖动
  if (mode !== 'webgl') {
    return <HeroFallbackGradient />;
  }

  return (
    <div
      className="absolute inset-x-0 top-0 z-0 opacity-65"
      style={{ bottom: '0', maskImage, WebkitMaskImage: maskImage }}
      aria-hidden
    >
      <Hyperspeed effectOptions={heroOptions} />
    </div>
  );
}
