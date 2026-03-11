'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface Card {
  id: number;
  title: string;
  subtitle: string;
  content: ReactNode;
  bgColor: string;
}

interface StackedCardsProps {
  cards: Card[];
}

export function StackedCards({ cards }: StackedCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-4xl mx-auto px-6">
          {cards.map((card, index) => {
            // 为每张卡片计算滚动进度
            const cardProgress = useTransform(
              scrollYProgress,
              [
                index / cards.length,
                (index + 0.5) / cards.length,
                (index + 1) / cards.length,
              ],
              [0, 0.5, 1]
            );

            // 卡片的 Y 轴位置（向上移动）
            const y = useTransform(
              cardProgress,
              [0, 0.5, 1],
              [index * 20, 0, -100]
            );

            // 卡片的缩放（从小到大）
            const scale = useTransform(
              cardProgress,
              [0, 0.5, 1],
              [1 - index * 0.05, 1, 0.95]
            );

            // 卡片的旋转（轻微倾斜）
            const rotateX = useTransform(
              cardProgress,
              [0, 0.5, 1],
              [index * 2, 0, -5]
            );

            // 卡片的透明度
            const opacity = useTransform(
              cardProgress,
              [0, 0.3, 0.5, 1],
              [0.6, 1, 1, 0]
            );

            // Z-index（越后面的卡片越靠上）
            const zIndex = cards.length - index;

            return (
              <motion.div
                key={card.id}
                style={{
                  y,
                  scale,
                  rotateX,
                  opacity,
                  zIndex,
                  transformPerspective: 1000,
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="w-full rounded-3xl p-12 shadow-2xl backdrop-blur-sm border border-white/10"
                  style={{
                    background: card.bgColor,
                  }}
                >
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-mono text-white/60 uppercase tracking-[0.3em] mb-3">
                        Card {card.id}
                      </div>
                      <h3 className="text-4xl font-bold text-white mb-2">
                        {card.title}
                      </h3>
                      <p className="text-xl text-white/80 font-light">
                        {card.subtitle}
                      </p>
                    </div>
                    <div className="text-white/70 leading-relaxed">
                      {card.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
