'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  hoverScale?: boolean;
  glowOnHover?: boolean;
}

export function AnimatedCard({
  children,
  delay = 0,
  className = '',
  hoverScale = true,
  glowOnHover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={
        hoverScale
          ? {
              y: -4,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={`
        rounded-2xl border border-white/10 bg-white/[0.03]
        transition-all duration-300
        ${glowOnHover ? 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,93,255,0.3)]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
