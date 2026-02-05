'use client';

import Link from 'next/link';
import { TextType } from './TextType';

export function Hero() {
  const scrollToTimeline = () => {
    const timelineSection = document.getElementById('timeline');
    if (timelineSection) {
      timelineSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-36 md:pt-40 lg:pt-44 pb-8 md:pb-10 overflow-hidden">
      <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 text-center">
          <div className="glass rounded-full px-5 py-2.5 flex items-center gap-3 glow">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
            <span className="font-space-mono text-sm md:text-md font-medium bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            HackerTrip - 黑客松 AI Agent
            </span>
          </div>

          {/* H2 - 固定标题 */}
          <h2 className="font-sora text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-100 leading-snug">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              HackerTrip
            </span>
            {' '}将为你
          </h2>

          {/* H1 - 打字效果 */}
          <h1 className="font-sora text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight min-h-[1.2em]">
            <span className="bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent">
              <TextType
                texts={[
                  "推荐你感兴趣的AI黑客松",
                  "推广你的AI黑客松项目",
                  "规划你的AI黑客松参赛行程",
                  "总结你的AI黑客松旅程",
                ]}
                typingSpeed={75}
                deletingSpeed={50}
                pauseDuration={1500}
                showCursor
                cursorCharacter="_"
                cursorBlinkDuration={0.5}
              />
            </span>
          </h1>

          <div className="w-20 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shimmer" />

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={scrollToTimeline}
              className="group relative px-8 py-3.5 rounded-full font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                发现黑客松
              </span>
            </button>

            <Link
              href="/agent-studio"
              className="group relative px-8 py-3.5 rounded-full font-medium text-white border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400/70 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Agent 创空间
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
