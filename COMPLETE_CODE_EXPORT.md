# HackerTrip 完整代码导出

> 本文档包含项目的所有源代码，可直接复制使用

---

## 📦 安装依赖

```bash
npm install lucide-react next@16.1.4 react@19.2.3 react-dom@19.2.3
npm install -D @tailwindcss/postcss tailwindcss typescript @types/node @types/react @types/react-dom
```

---

## 📁 src/components/Navbar.tsx

```typescript
'use client';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[1440px] mx-auto px-8">
        <nav className="glass rounded-full px-8 py-4 flex items-center justify-between glow shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="font-sora text-sm font-extrabold text-white">H</span>
            </div>
            <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              HackerTrip
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="font-space-mono text-sm font-medium text-white hover:text-indigo-300 transition-colors relative group">
              Hackathon
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-100 group-hover:scale-x-110 transition-transform" />
            </a>
            <a href="#" className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors">
              Talent
            </a>
            <a href="#" className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors">
              Community
            </a>
          </div>

          <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 transform">
            <span className="font-space-mono text-sm font-medium text-white">
              Sign in
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
```

---

## 📁 src/components/Hero.tsx

```typescript
'use client';

export function Hero() {
  return (
    <section className="relative pt-40 pb-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[1440px] mx-auto px-8">
        <div className="w-full max-w-[900px] mx-auto flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3 glow">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
            <span className="font-space-mono text-sm font-medium bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              Track Your Hacker Journey
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-sora text-7xl font-extrabold text-center leading-tight">
            <span className="bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent">
              Hackathon
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Timeline
            </span>
          </h1>

          {/* Description */}
          <p className="font-space-mono text-base text-gray-300 text-center max-w-[600px] leading-relaxed">
            Navigate through past achievements and upcoming opportunities across the globe
          </p>

          {/* Animated line */}
          <div className="w-24 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shimmer" />
        </div>
      </div>
    </section>
  );
}
```

---

## 📁 src/components/Timeline.tsx

```typescript
'use client';

import { hackathons } from '@/data/hackathons';

interface TimelineProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function Timeline({ selectedId, onSelect }: TimelineProps) {
  return (
    <section className="relative py-20">
      <div className="w-full max-w-[1440px] mx-auto px-8">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center gap-16">
          {/* Year badge */}
          <div className="glass rounded-2xl px-8 py-4">
            <h2 className="font-sora text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              2026
            </h2>
          </div>

          {/* Timeline */}
          <div className="w-full">
            {/* Event names row */}
            <div className="flex justify-between items-center mb-6">
              {hackathons.map((h) => (
                <div key={h.id} className="flex-1 flex justify-center">
                  <button
                    onClick={() => onSelect(h.id)}
                    className={`font-sora text-sm font-bold transition-all cursor-pointer ${
                      selectedId === h.id
                        ? 'text-white scale-110'
                        : h.isPast
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {h.shortName}
                  </button>
                </div>
              ))}
            </div>

            {/* Timeline line and dots */}
            <div className="relative h-[100px] mb-6">
              {/* Background line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full" />

              {/* Dots container */}
              <div className="absolute inset-0 flex justify-between items-center">
                {hackathons.map((h) => (
                  <div key={h.id} className="flex-1 flex justify-center">
                    <button
                      onClick={() => onSelect(h.id)}
                      className="relative cursor-pointer group"
                    >
                      {/* Selected glow */}
                      {selectedId === h.id && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 blur-lg animate-pulse" />
                      )}

                      {/* Past event subtle glow */}
                      {h.isPast && selectedId !== h.id && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-10 group-hover:opacity-15 transition-opacity" />
                      )}

                      {/* The dot itself */}
                      <div
                        className={`relative w-4 h-4 rounded-full transition-all duration-300 ${
                          selectedId === h.id
                            ? 'bg-gradient-to-r from-indigo-400 to-purple-400 scale-150 shadow-lg shadow-indigo-500/50'
                            : h.isPast
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:scale-125'
                            : 'bg-gray-600 group-hover:bg-gray-500 group-hover:scale-110'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Date ranges row */}
            <div className="flex justify-between items-center mb-4">
              {hackathons.map((h) => (
                <div key={h.id} className="flex-1 flex justify-center">
                  <button
                    onClick={() => onSelect(h.id)}
                    className={`font-space-mono text-sm font-medium transition-colors cursor-pointer ${
                      selectedId === h.id
                        ? 'text-indigo-300'
                        : h.isPast
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {h.dateRange}
                  </button>
                </div>
              ))}
            </div>

            {/* Cities row */}
            <div className="flex justify-between items-center">
              {hackathons.map((h) => (
                <div key={h.id} className="flex-1 flex justify-center">
                  <button
                    onClick={() => onSelect(h.id)}
                    className={`font-space-mono text-xs transition-colors cursor-pointer ${
                      selectedId === h.id
                        ? 'text-gray-400'
                        : h.isPast
                        ? 'text-gray-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {h.city}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 📁 src/components/Footer.tsx

```typescript
'use client';

export function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Top gradient line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="w-full max-w-[1440px] mx-auto px-8 py-16">
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between">
            {/* Left - Copyright */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="font-sora text-sm font-extrabold text-white">H</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sora text-sm font-bold text-white">HackerTrip</span>
                <span className="font-space-mono text-xs text-gray-500">© 2026 All rights reserved</span>
              </div>
            </div>

            {/* Center - Stats */}
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  380+
                </span>
                <span className="font-space-mono text-xs text-gray-400">Hackers</span>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  6
                </span>
                <span className="font-space-mono text-xs text-gray-400">Events</span>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  $230K+
                </span>
                <span className="font-space-mono text-xs text-gray-400">Prizes</span>
              </div>
            </div>

            {/* Right - Version */}
            <div className="glass rounded-full px-4 py-2">
              <span className="font-space-mono text-xs text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

**注意**: EventDetail.tsx 和 hackathons.ts 代码较长，已保存在项目文件中。

获取完整代码:
- EventDetail: `src/components/EventDetail.tsx`
- Data: `src/data/hackathons.ts`
- 或使用打包文件: `hackertrip-package.tar.gz`

---

## 🚀 快速使用指南

1. **创建新项目**
```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
```

2. **安装依赖**
```bash
npm install lucide-react
```

3. **复制文件**
- 复制上述所有组件代码到对应目录
- 复制 globals.css 内容
- 复制 layout.tsx 和 page.tsx

4. **运行**
```bash
npm run dev
```

---

生成时间: ${new Date().toLocaleString('zh-CN')}
