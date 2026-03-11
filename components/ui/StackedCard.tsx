'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StackedCardProps {
  title: string;
  subtitle: string;
  content: ReactNode;
  bgColor: string;
  stackLayers?: number;
  delay?: number;
}

export function StackedCard({
  title,
  subtitle,
  content,
  bgColor,
  stackLayers = 3,
  delay = 0,
}: StackedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Stack Layers - 背景堆叠效果 */}
      {Array.from({ length: stackLayers }).map((_, index) => {
        const offset = (stackLayers - index) * 6; // 每层偏移 6px
        const scale = 1 - (stackLayers - index) * 0.02; // 每层缩小 2%
        const opacity = 0.3 + (index / stackLayers) * 0.4; // 透明度从 0.3 到 0.7

        return (
          <div
            key={index}
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `linear-gradient(135deg, rgba(124, 93, 255, ${opacity}) 0%, rgba(199, 89, 255, ${opacity}) 100%)`,
              transform: `translateY(${offset}px) scale(${scale})`,
              zIndex: -index - 1,
              filter: 'blur(1px)',
            }}
          />
        );
      })}

      {/* Main Card - 主卡片 */}
      <div
        className="relative rounded-3xl p-12 shadow-2xl backdrop-blur-sm border border-white/10 overflow-hidden"
        style={{
          background: bgColor,
          zIndex: 1,
        }}
      >
        {/* 装饰性渐变光 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <div className="relative space-y-6">
          <div>
            <div className="text-sm font-mono text-white/60 uppercase tracking-[0.3em] mb-3">
              Card {delay * 5 + 1}
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {title}
            </h3>
            <p className="text-xl text-white/80 font-light">
              {subtitle}
            </p>
          </div>
          <div className="text-white/70 leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
