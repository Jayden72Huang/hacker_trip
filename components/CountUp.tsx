'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number; // 动画持续时间（秒）
  suffix?: string; // 后缀（如 "+"、"%"）
  className?: string;
}

/**
 * 数字滚动组件
 * 使用 requestAnimationFrame 实现平滑的数字滚动动画
 * 配合 Framer Motion 的 useInView 在元素进入视口时触发
 */
export function CountUp({ end, duration = 2, suffix = '', className = '' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // easeOutCubic 缓动函数：快速启动，缓慢结束
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + (end - startValue) * easeProgress);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end); // 确保最终值精确
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // 清理函数：组件卸载时取消动画
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}
