'use client';

import { useRef, useCallback, useEffect, type ReactNode, type MouseEvent } from 'react';

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  borderRadius?: string;
  thickness?: number;
}

export function TiltedCard({
  children,
  className = '',
  rotateAmplitude = 14,
  scaleOnHover = 1.05,
  borderRadius = '16px',
  thickness = 6,
}: TiltedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const current = useRef({ rx: 0, ry: 0, s: 1 });
  const target = useRef({ rx: 0, ry: 0, s: 1 });
  const raf = useRef<number>(0);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    const c = current.current;
    const t = target.current;
    const ease = 0.12;

    c.rx = lerp(c.rx, t.rx, ease);
    c.ry = lerp(c.ry, t.ry, ease);
    c.s = lerp(c.s, t.s, ease);

    if (cardRef.current) {
      cardRef.current.style.transform =
        `perspective(800px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale3d(${c.s},${c.s},${c.s})`;
    }

    if (glareRef.current) {
      const gx = 50 + c.ry * 2;
      const gy = 50 - c.rx * 2;
      const intensity = Math.sqrt(c.rx * c.rx + c.ry * c.ry) / rotateAmplitude;
      glareRef.current.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, rgba(124,93,255,${0.2 * intensity}), rgba(77,225,255,${0.1 * intensity}) 40%, transparent 70%)`;
    }

    if (shadowRef.current) {
      const ox = -c.ry * 1.5;
      const oy = c.rx * 1.5;
      const blur = 40 + Math.abs(c.rx + c.ry) * 1.2;
      shadowRef.current.style.transform = `translate(${ox}px, ${oy}px)`;
      shadowRef.current.style.filter = `blur(${blur}px)`;
    }

    if (
      Math.abs(c.rx - t.rx) > 0.01 ||
      Math.abs(c.ry - t.ry) > 0.01 ||
      Math.abs(c.s - t.s) > 0.001
    ) {
      raf.current = requestAnimationFrame(animate);
    }
  }, [rotateAmplitude]);

  const kick = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    target.current.rx = (py - 0.5) * -2 * rotateAmplitude;
    target.current.ry = (px - 0.5) * 2 * rotateAmplitude;
    target.current.s = scaleOnHover;
    kick();
  }, [rotateAmplitude, scaleOnHover, kick]);

  const handleLeave = useCallback(() => {
    target.current = { rx: 0, ry: 0, s: 1 };
    kick();
  }, [kick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        ref={shadowRef}
        aria-hidden
        className="absolute inset-4 -z-10 pointer-events-none"
        style={{
          background: 'rgba(124,93,255,0.3)',
          filter: 'blur(40px)',
          borderRadius,
        }}
      />

      <div
        ref={cardRef}
        style={{
          transformStyle: 'preserve-3d',
          borderRadius,
          willChange: 'transform',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius,
            transform: `translateZ(-${thickness}px)`,
            background: '#0a0a14',
            boxShadow: 'inset 0 0 0 1px rgba(124,93,255,0.1)',
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 left-0 h-full pointer-events-none"
          style={{
            width: `${thickness}px`,
            transform: 'rotateY(-90deg) translateZ(0px)',
            transformOrigin: 'left',
            background: 'linear-gradient(to right, #0c0c18, #14142a)',
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 right-0 h-full pointer-events-none"
          style={{
            width: `${thickness}px`,
            transform: 'rotateY(90deg) translateZ(0px)',
            transformOrigin: 'right',
            background: 'linear-gradient(to left, #0c0c18, #14142a)',
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          style={{
            height: `${thickness}px`,
            transform: 'rotateX(90deg) translateZ(0px)',
            transformOrigin: 'bottom',
            background: 'linear-gradient(to top, #08081a, #14142a)',
          }}
        />

        <div className="relative" style={{ borderRadius, overflow: 'hidden' }}>
          {children}
          <div
            ref={glareRef}
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius, mixBlendMode: 'screen' }}
          />
        </div>
      </div>
    </div>
  );
}
