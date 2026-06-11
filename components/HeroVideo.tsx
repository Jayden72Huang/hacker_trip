"use client";

import { useEffect, useState } from "react";

interface HeroVideoProps {
  src: string;
  poster: string;
  posterSrcSet?: string;
  className?: string;
}

/**
 * Hero 背景视频：基础层始终是静态 poster（LCP 友好），
 * 仅桌面端（≥768px）且页面 load 完成后才挂载 <video>，
 * 移动端 / 慢网不下载 1.9MB 视频，省带宽省电也不抢 LCP。
 */
export function HeroVideo({ src, poster, posterSrcSet, className = "" }: HeroVideoProps) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const start = () => setShowVideo(true);
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        srcSet={posterSrcSet}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        className={className}
      />
      {showVideo && (
        <video
          className={className}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
    </>
  );
}
