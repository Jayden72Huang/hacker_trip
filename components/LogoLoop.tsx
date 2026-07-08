'use client';

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export type LogoItem =
  | { node: React.ReactNode; title?: string; href?: string; ariaLabel?: string }
  | { src: string; alt?: string; title?: string; href?: string; srcSet?: string; sizes?: string; width?: number; height?: number };

export interface LogoLoopProps {
  logos: LogoItem[];
  /** 滚动速度（px/s），负数反向 */
  speed?: number;
  direction?: 'left' | 'right';
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  /** 悬停时的速度倍率：0 = 暂停，0.5 = 减速一半，不传 = 不变 */
  hoverSpeed?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  /** 两侧渐隐色，默认取页面背景 */
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
}

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = (value?: number | string) =>
  typeof value === 'number' ? `${value}px` : (value ?? undefined);

function useResizeObserver(
  callback: () => void,
  elements: React.RefObject<Element | null>[],
  dependencies: React.DependencyList
) {
  useEffect(() => {
    if (typeof window.ResizeObserver === 'undefined') {
      window.addEventListener('resize', callback);
      callback();
      return () => window.removeEventListener('resize', callback);
    }
    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => observers.forEach((observer) => observer?.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

function useImageLoader(
  seqRef: React.RefObject<HTMLUListElement | null>,
  onLoad: () => void,
  dependencies: React.DependencyList
) {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    if (images.length === 0) {
      onLoad();
      return;
    }
    let remaining = images.length;
    const handleImageLoad = () => {
      remaining -= 1;
      if (remaining === 0) onLoad();
    };
    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;
      if (htmlImg.complete) {
        handleImageLoad();
      } else {
        htmlImg.addEventListener('load', handleImageLoad, { once: true });
        htmlImg.addEventListener('error', handleImageLoad, { once: true });
      }
    });
    return () => {
      images.forEach((img) => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Logo 无限循环滚动组件（ReactBits LogoLoop 移植版）
 * - rAF 驱动的匀速滚动，悬停可暂停/减速
 * - 自动按容器宽度复制序列，实现无缝循环
 * - 支持 React 节点和图片两种 logo 形态
 */
export default function LogoLoop({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  hoverSpeed,
  pauseOnHover,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = 'Partner logos',
  className,
  style,
  ref,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState<number>(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveHoverSpeed = hoverSpeed ?? (pauseOnHover ? 0 : undefined);

  const targetVelocity = useMemo(() => {
    const magnitude = Math.abs(speed);
    const directionMultiplier = direction === 'left' ? 1 : -1;
    const speedMultiplier = speed < 0 ? -1 : 1;
    let result = magnitude * directionMultiplier * speedMultiplier;
    if (isHovered && effectiveHoverSpeed !== undefined) result *= effectiveHoverSpeed;
    return result;
  }, [speed, direction, isHovered, effectiveHoverSpeed]);

  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceWidth = seqRef.current?.getBoundingClientRect?.()?.width ?? 0;
    if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded =
        Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, []);

  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);

  // rAF 动画循环：offset 沿 targetVelocity 平滑推进，取模保证无缝
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  useEffect(() => {
    if (seqWidth === 0) return;
    let rafId: number;
    let lastTimestamp: number | null = null;
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const deltaTime = Math.max(0, timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (targetVelocity - velocityRef.current) * easingFactor;

      let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
      nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth;
      offsetRef.current = nextOffset;

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    if (prefersReduced) {
      if (trackRef.current) trackRef.current.style.transform = 'translate3d(0, 0, 0)';
      return;
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [targetVelocity, seqWidth]);

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  const renderLogoItem = (item: LogoItem, key: string) => {
    const isNodeItem = 'node' in item;
    const content = isNodeItem ? (
      <span
        className="inline-flex items-center transition-transform duration-300 ease-out"
        style={{ fontSize: logoHeight, lineHeight: 1 }}
        aria-hidden={!!item.href && !item.ariaLabel}
      >
        {item.node}
      </span>
    ) : (
      // 外部提供的 logo 图片，尺寸不定，走原生 img 按高度自适应
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.src}
        srcSet={item.srcSet}
        sizes={item.sizes}
        width={item.width}
        height={item.height}
        alt={item.alt ?? item.title ?? ''}
        title={item.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block object-contain transition-transform duration-300 ease-out select-none"
        style={{ height: logoHeight, width: 'auto' }}
      />
    );

    const itemAriaLabel = isNodeItem
      ? (item.ariaLabel ?? item.title)
      : (item.alt ?? item.title);

    const inner = item.href ? (
      <a
        href={item.href}
        aria-label={itemAriaLabel || 'logo link'}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center rounded transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-current focus-visible:outline-offset-2"
      >
        {content}
      </a>
    ) : (
      content
    );

    return (
      <li
        key={key}
        role="listitem"
        className={`flex-none leading-none ${scaleOnHover ? 'group/logo' : ''}`}
        style={{ marginRight: gap }}
      >
        {scaleOnHover ? (
          <span className="inline-flex transition-transform duration-300 ease-out group-hover/logo:scale-115">
            {inner}
          </span>
        ) : (
          inner
        )}
      </li>
    );
  };

  const logoLists = useMemo(
    () =>
      Array.from({ length: copyCount }, (_, copyIndex) => (
        <ul
          key={`copy-${copyIndex}`}
          role="list"
          className="flex items-center"
          aria-hidden={copyIndex > 0}
          ref={copyIndex === 0 ? seqRef : undefined}
        >
          {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
        </ul>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copyCount, logos, gap, logoHeight, scaleOnHover]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-x-hidden ${className ?? ''}`}
      style={{ width: toCssLength(width) ?? '100%', ...style }}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {fadeOut && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-24"
            style={{
              background: `linear-gradient(to right, ${fadeOutColor ?? '#05060a'}, transparent)`,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-24"
            style={{
              background: `linear-gradient(to left, ${fadeOutColor ?? '#05060a'}, transparent)`,
            }}
          />
        </>
      )}
      <div ref={trackRef} className="flex w-max will-change-transform select-none">
        {logoLists}
      </div>
    </div>
  );
}
