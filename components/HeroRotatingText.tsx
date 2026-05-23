'use client';

import RotatingText from './RotatingText';

export function HeroRotatingText() {
  return (
    <RotatingText
      texts={['发现比赛', '匹配项目', '组建团队', '赢取奖金']}
      mainClassName="px-3 md:px-5 py-1 md:py-2 bg-purple-500 text-white overflow-hidden justify-center rounded-lg"
      staggerFrom="last"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-120%' }}
      staggerDuration={0.025}
      splitLevelClassName="overflow-hidden pb-0.5 md:pb-1"
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      rotationInterval={2500}
    />
  );
}
