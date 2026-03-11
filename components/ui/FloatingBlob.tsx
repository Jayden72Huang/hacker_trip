'use client';

interface FloatingBlobProps {
  size?: number;
  colors?: string[];
  blur?: number;
  duration?: number;
  className?: string;
}

export function FloatingBlob({
  size = 600,
  colors = ['#7c5dff', '#4de1ff', '#c759ff'],
  blur = 80,
  duration = 25,
  className = '',
}: FloatingBlobProps) {
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`,
        filter: `blur(${blur}px)`,
        animation: `spin-slow ${duration}s linear infinite`,
      }}
    />
  );
}
