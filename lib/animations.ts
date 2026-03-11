import { Variants } from 'framer-motion';

/**
 * 全局动画配置中心
 * 统一整个网站的滚动动画参数，确保视觉一致性
 */

// 通用渐显向上动画
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1], // easeOutCubic
    },
  },
};

// 卡片网格容器动画（带 stagger）
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 子元素间隔 0.1s 依次出现
      delayChildren: 0.2, // 容器动画后 0.2s 开始子元素动画
    },
  },
};

// 卡片子项动画
export const cardItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// 统一 viewport 配置
export const defaultViewport = {
  once: true, // 只触发一次动画
  margin: '-80px', // 提前 80px 触发动画
  amount: 0.3, // 元素可见 30% 时触发
};

// ScrollFloat 统一配置
export const scrollFloatConfig = {
  animationDuration: 1,
  ease: 'back.inOut(2)',
  scrollStart: 'top 85%',
  scrollEnd: 'top 50%',
  stagger: 0.03, // 字符间隔
  gradientColors: {
    from: '#818cf8', // indigo-400
    via: '#c084fc', // purple-400
    to: '#f472b6', // pink-400
  },
};

// 额外动画变体

// 从左侧滑入
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// 从右侧滑入
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// 缩放淡入
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // easeOutExpo
    },
  },
};

// 旋转淡入（用于 Logo、图标等）
export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};
