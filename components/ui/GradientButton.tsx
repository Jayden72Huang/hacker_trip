'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
}

export function GradientButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: GradientButtonProps) {
  const baseStyles = 'px-8 py-3.5 rounded-full font-medium text-white transition-all duration-300';

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-indigo-500 to-purple-600
      hover:from-indigo-600 hover:to-purple-700
      hover:shadow-lg hover:shadow-purple-500/30
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      border border-purple-500/30 bg-purple-500/10
      hover:bg-purple-500/20 hover:border-purple-400/50
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
