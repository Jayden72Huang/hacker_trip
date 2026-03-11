'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const [userCount, setUserCount] = useState(380);
  const [projectCount, setProjectCount] = useState(0);

  const MIN_DISPLAY_COUNT = 327; // 最小显示数量

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.userCount > MIN_DISPLAY_COUNT) {
          setUserCount(data.userCount);
        }
        setProjectCount(data.projectCount || 0);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="relative mt-14 md:mt-16">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-12 md:py-16">
        <div className="glass rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="HackerTrip"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <div className="flex flex-col">
                  <span className="font-sora text-sm font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    HackerTrip
                  </span>
                  <span className="font-space-mono text-xs text-gray-500">© 2026 All rights reserved</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <Link href="/docs" className="transition-colors hover:text-white">
                  帮助中心
                </Link>
                <Link href="/community" className="transition-colors hover:text-white">
                  社区
                </Link>
                <Link href="/products" className="transition-colors hover:text-white">
                  作品榜
                </Link>
                <Link href="/organize" className="transition-colors hover:text-white">
                  发起黑客松
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-7">
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  {userCount}+
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">开发者</span>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  {projectCount}
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">作品</span>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  6
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">活动</span>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  $230K+
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">奖金池</span>
              </div>
            </div>

            <div className="glass rounded-full px-4 py-2">
              <span className="font-space-mono text-[11px] text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
