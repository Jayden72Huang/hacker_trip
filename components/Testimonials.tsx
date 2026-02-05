'use client';

import { useEffect, useRef, useState } from 'react';
import { Quote, Users } from 'lucide-react';
import gsap from 'gsap';

// Mock 用户评价数据
const testimonials = [
  {
    id: 1,
    name: '张明远',
    role: '全栈工程师 @ 字节跳动',
    avatar: '👨‍💻',
    content: '通过 HackerTrip 发现了 ETHGlobal 黑客松，第一次出国参赛就拿了二等奖！行程规划功能帮我省了很多时间。',
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'AI Researcher @ Stanford',
    avatar: '👩‍🔬',
    content: 'The personalized recommendations are incredibly accurate. Won $50K at an AGI House event I discovered here!',
  },
  {
    id: 3,
    name: '李浩然',
    role: '产品经理 @ 阿里巴巴',
    avatar: '👨‍💼',
    content: '作为非技术背景的 PM，HackerTrip 帮我找到了好几个适合产品经理参与的黑客松，结识了很多优秀的开发者。',
  },
  {
    id: 4,
    name: 'Michael Wang',
    role: 'Indie Hacker',
    avatar: '🧑‍💻',
    content: '项目展示功能帮我的黑客松作品获得了 5000+ 曝光，还因此收到了 YC 的面试邀请！',
  },
  {
    id: 5,
    name: '王小月',
    role: '设计师 @ Figma',
    avatar: '👩‍🎨',
    content: '发现了很多注重用户体验的活动。去年在 Figma 主办的活动中我们团队获得了最佳设计奖！',
  },
  {
    id: 6,
    name: 'David Liu',
    role: 'Web3 Dev @ Paradigm',
    avatar: '⛓️',
    content: 'Web3 hackathon recommendations are spot on. Already earned over $100K in bounties through projects I found here.',
  },
  {
    id: 7,
    name: '林思雨',
    role: '大三学生 @ 清华大学',
    avatar: '👩‍🎓',
    content: '暑假参加了3场黑客松，从北京到旧金山。实习 offer 也是在黑客松上拿到的！',
  },
  {
    id: 8,
    name: 'Alex Thompson',
    role: 'Tech Lead @ Google',
    avatar: '👨‍💻',
    content: 'Great for team building activities. The detailed event info makes organizing group participation a breeze.',
  },
];

// Count Up Hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// 单个评价卡片
function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="flex-shrink-0 w-[300px] mx-2">
      <div className="h-full p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
        {/* Quote */}
        <Quote size={18} className="text-white/20 mb-3" />

        {/* Content */}
        <p className="text-sm text-gray-300 leading-relaxed mb-4 line-clamp-3">
          {testimonial.content}
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-base">
            {testimonial.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{testimonial.name}</p>
            <p className="text-xs text-gray-500 truncate">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// GSAP 驱动的走马灯行组件 - 平滑变速
function MarqueeRow({
  items,
  direction = 'left',
  baseSpeed = 50
}: {
  items: typeof testimonials;
  direction?: 'left' | 'right';
  baseSpeed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const currentTimeScale = useRef(1);

  // 复制3份用于无缝滚动
  const tripled = [...items, ...items, ...items];

  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const totalWidth = track.scrollWidth / 3;

    // 设置初始位置
    if (direction === 'right') {
      gsap.set(track, { x: -totalWidth });
    }

    // 创建无限滚动动画
    const tween = gsap.to(track, {
      x: direction === 'left' ? -totalWidth : 0,
      duration: baseSpeed,
      ease: 'none',
      repeat: -1,
      onRepeat: () => {
        // 重置位置实现无缝循环
        if (direction === 'left') {
          gsap.set(track, { x: 0 });
        } else {
          gsap.set(track, { x: -totalWidth });
        }
      }
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [direction, baseSpeed]);

  // 平滑变速处理
  const handleMouseEnter = () => {
    if (tweenRef.current) {
      // 平滑过渡到 0.3 倍速
      gsap.to(currentTimeScale, {
        current: 0.3,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          tweenRef.current?.timeScale(currentTimeScale.current);
        }
      });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      // 平滑过渡回 1 倍速
      gsap.to(currentTimeScale, {
        current: 1,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          tweenRef.current?.timeScale(currentTimeScale.current);
        }
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={trackRef}
        className="flex will-change-transform"
      >
        {tripled.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const { count, ref } = useCountUp(12847, 2500);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14 px-6 space-y-5">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
            <Users size={18} className="text-emerald-400" />
            <span className="text-sm font-medium text-gray-300">来自全球黑客松爱好者评价</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tabular-nums">
              {count.toLocaleString()}+
            </span>{' '}
            人已经在 HackerTrip 受益
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            开发者、设计师、产品经理、学生...不同背景的人都在这里找到了机会
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#05060a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#05060a] to-transparent z-10 pointer-events-none" />

          {/* Row 1 - Scroll Left */}
          <div className="mb-4">
            <MarqueeRow items={testimonials} direction="left" baseSpeed={40} />
          </div>

          {/* Row 2 - Scroll Right (reversed order) */}
          <div>
            <MarqueeRow items={[...testimonials].reverse()} direction="right" baseSpeed={45} />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 px-6">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: '50+', label: '合作黑客松' },
              { value: '30+', label: '覆盖国家' },
              { value: '$2M+', label: '帮助获得奖金' },
              { value: '98%', label: '用户满意度' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
