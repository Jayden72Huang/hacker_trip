'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  containerClassName?: string;
  // 渐变色定义：from, via, to
  gradientColors?: {
    from: string;
    via?: string;
    to: string;
  };
  splitByWord?: boolean;
}

export default function ScrollFloat({
  children,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'top 85%',
  scrollEnd = 'top 50%',
  stagger = 0.03,
  containerClassName = '',
  gradientColors,
  splitByWord = false,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const text = textRef.current.textContent || '';
    const chars = splitByWord ? text.split(' ') : text.split('');
    const totalChars = chars.length;

    // 清空并重新填充
    textRef.current.innerHTML = '';

    // 构建渐变
    let gradient = '';
    if (gradientColors) {
      if (gradientColors.via) {
        gradient = `linear-gradient(90deg, ${gradientColors.from}, ${gradientColors.via}, ${gradientColors.to})`;
      } else {
        gradient = `linear-gradient(90deg, ${gradientColors.from}, ${gradientColors.to})`;
      }
    }

    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = splitByWord ? (i > 0 ? ' ' + char : char) : char;
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';

      if (gradient) {
        // 计算这个字符在整体渐变中的位置
        const startPercent = (i / totalChars) * 100;
        const endPercent = ((i + 1) / totalChars) * 100;
        // 使用整体渐变，通过 background-position 来显示对应部分
        span.style.background = gradient;
        span.style.backgroundSize = `${totalChars * 100}% 100%`;
        span.style.backgroundPosition = `${startPercent}% 0`;
        span.style.backgroundClip = 'text';
        span.style.webkitBackgroundClip = 'text';
        span.style.color = 'transparent';
      }

      if (char === ' ' && !splitByWord) {
        span.style.width = '0.3em';
      }
      textRef.current?.appendChild(span);
    });

    const charSpans = textRef.current.querySelectorAll('span');

    // 设置初始状态
    gsap.set(charSpans, {
      y: 30,
      opacity: 0,
    });

    const ctx = gsap.context(() => {
      gsap.to(charSpans, {
        y: 0,
        opacity: 1,
        duration: animationDuration,
        ease: ease,
        stagger: stagger,
        scrollTrigger: {
          trigger: containerRef.current,
          start: scrollStart,
          end: scrollEnd,
          toggleActions: 'play none none reverse',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [children, animationDuration, ease, scrollStart, scrollEnd, stagger, splitByWord, gradientColors]);

  return (
    <span ref={containerRef} className={`inline-block ${containerClassName}`}>
      <span ref={textRef} className="inline-flex">
        {children}
      </span>
    </span>
  );
}
