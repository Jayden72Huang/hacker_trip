'use client';

import RotatingText from './RotatingText';

export function HeroRotatingText() {
  return (
    <RotatingText
      texts={['找到适合你的比赛', '一键匹配你的项目', 'AI 推荐最佳赛道', '开启你的下一场冒险']}
      mainClassName="px-3 md:px-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 overflow-hidden py-1 md:py-2 justify-center rounded-xl text-indigo-200"
      staggerFrom="last"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-120%' }}
      staggerDuration={0.025}
      splitLevelClassName="overflow-hidden pb-0.5 md:pb-1"
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      rotationInterval={3000}
    />
  );
}
