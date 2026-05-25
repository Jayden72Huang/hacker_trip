'use client';

import dynamic from 'next/dynamic';

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

export function HyperspeedHero() {
  return (
    <div
      className="absolute inset-x-0 top-0 z-0 opacity-65"
      style={{
        bottom: '-120px',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 80%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 80%)',
      }}
      aria-hidden
    >
      <Hyperspeed effectOptions={heroOptions} />
    </div>
  );
}
