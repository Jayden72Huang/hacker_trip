'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Calendar,
  Filter,
  Rocket,
  History,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { HackathonDBCard, isPast, matchesHackathonSearch, modeLabel, type DBHackathon, type HackathonMode } from '@/components/HackathonDBCard';

type FilterType = 'all' | HackathonMode;
type SortType = 'date' | 'prize' | 'name';
type TabType = 'upcoming' | 'past';

// 模块级缓存：SPA 内从子页返回首页时直接复用，避免重新请求 + loading 闪烁
let cachedHackathons: DBHackathon[] | null = null;

export function HackathonListSection() {
  const [hackathons, setHackathons] = useState<DBHackathon[]>(cachedHackathons ?? []);
  const [loading, setLoading] = useState(cachedHackathons === null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  useEffect(() => {
    let cancelled = false;
    // 有缓存时先用缓存渲染（不阻塞），后台仍请求一次以刷新数据（stale-while-revalidate）
    fetch('/api/hackathons')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        cachedHackathons = arr;
        setHackathons(arr);
      })
      .catch(() => { if (!cancelled) setHackathons([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { upcoming, past } = useMemo(() => {
    let filtered = hackathons.filter((h) => {
      const matchesSearch = matchesHackathonSearch(h, searchQuery);

      const matchesFormat =
        formatFilter === 'all' || h.mode === formatFilter;

      return matchesSearch && matchesFormat;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'prize') {
        const prizeA = parseInt((a.prizePool || '0').replace(/[^0-9]/g, '')) || 0;
        const prizeB = parseInt((b.prizePool || '0').replace(/[^0-9]/g, '')) || 0;
        return prizeB - prizeA;
      }
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return {
      upcoming: filtered.filter((h) => !isPast(h.endDate)),
      past: filtered.filter((h) => isPast(h.endDate)),
    };
  }, [hackathons, searchQuery, formatFilter, sortBy]);

  const displayList = activeTab === 'upcoming' ? upcoming : past;

  return (
    <section id="hackathons" className="w-full">
      {/* Tab 头部 + 背景图 */}
      <div className="relative w-full">
        {/* 背景图容器 — 用 mask 四边淡出 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 55%, transparent 100%)',
          }}
        >
          {/* Upcoming 背景 — 鲜艳紫色调 */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: "url('/images/events-banner.webp')",
              backgroundPosition: 'left center',
              opacity: activeTab === 'upcoming' ? 0.5 : 0,
              filter: 'saturate(0.85) brightness(0.9)',
            }}
          />
          {/* Past 背景 — 去饱和灰蓝色调 */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: "url('/images/events-banner.webp')",
              backgroundPosition: 'right center',
              opacity: activeTab === 'past' ? 0.42 : 0,
              filter: 'saturate(0.35) brightness(0.78)',
            }}
          />
          {/* 色调叠加 */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: activeTab === 'upcoming'
                ? 'linear-gradient(135deg, rgba(34,211,238,0.14) 0%, rgba(5,10,16,0.42) 58%, rgba(5,6,10,0.78) 100%)'
                : 'linear-gradient(135deg, rgba(5,6,10,0.6) 0%, rgba(71,85,105,0.2) 55%, rgba(5,6,10,0.8) 100%)',
            }}
          />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pt-16 md:pt-20 pb-16">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`text-left transition-all duration-500 ${activeTab === 'upcoming' ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-60 scale-95'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <h2 className={`font-sora text-2xl md:text-3xl font-bold transition-colors ${
              activeTab === 'upcoming' ? 'text-white' : 'text-gray-400'
            }`}>
              即将开始
            </h2>
            <span className={`px-2.5 py-1 rounded-full font-space-mono text-sm transition-all ${
              activeTab === 'upcoming'
                ? 'bg-cyan-300/12 text-cyan-100'
                : 'bg-gray-500/20 text-gray-500'
            }`}>
              {upcoming.length}
            </span>
          </div>
          <p className="font-space-mono text-sm text-gray-400">
            发现即将举办的黑客松，立即报名参与
          </p>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`text-left md:text-right transition-all duration-500 ${activeTab === 'past' ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-60 scale-95'}`}
        >
          <div className="flex items-center gap-3 mb-2 md:flex-row-reverse">
            <span className={`px-2.5 py-1 rounded-full font-space-mono text-sm transition-all ${
              activeTab === 'past'
                ? 'bg-cyan-300/12 text-cyan-100'
                : 'bg-gray-500/20 text-gray-500'
            }`}>
              {past.length}
            </span>
            <h2 className={`font-sora text-xl md:text-2xl font-bold transition-colors ${
              activeTab === 'past' ? 'text-white' : 'text-gray-400'
            }`}>
              往届回顾
            </h2>
          </div>
          <p className="font-space-mono text-sm text-gray-500">
            回顾精彩往届赛事，获取灵感启发
          </p>
        </button>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 pb-8">
      <div className="relative z-20 rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜索黑客松名称、城市、组织方..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-12 pr-4 font-space-mono text-sm text-white transition-all placeholder:text-gray-500 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/50"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-space-mono text-sm text-gray-300 transition-all hover:border-white/20 hover:bg-white/10"
              >
                <Filter size={16} />
                {formatFilter === 'all' ? '全部形式' : modeLabel(formatFilter as HackathonMode)}
                <ChevronDown size={16} />
              </button>
              {showFilterDropdown && (
                <div className="absolute top-full left-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-xl">
                  {[
                    { value: 'all', label: '全部形式' },
                    { value: 'offline', label: '线下' },
                    { value: 'online', label: '线上' },
                    { value: 'hybrid', label: '混合' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFormatFilter(option.value as FilterType); setShowFilterDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-space-mono transition-all ${
                        formatFilter === option.value
                          ? 'bg-cyan-300/12 text-cyan-100'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-space-mono text-sm text-gray-300 transition-all hover:border-white/20 hover:bg-white/10"
              >
                <Calendar size={16} />
                {sortBy === 'date' ? '按日期' : sortBy === 'prize' ? '按奖金' : '按名称'}
                <ChevronDown size={16} />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-xl">
                  {[
                    { value: 'date', label: '按日期' },
                    { value: 'prize', label: '按奖金' },
                    { value: 'name', label: '按名称' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSortBy(option.value as SortType); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-space-mono transition-all ${
                        sortBy === option.value
                          ? 'bg-cyan-300/12 text-cyan-100'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* 黑客松卡片列表 */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-10">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={32} className="text-cyan-100 animate-spin mx-auto mb-4" />
            <p className="font-space-mono text-sm text-gray-500">加载中...</p>
          </div>
        ) : displayList.length > 0 ? (
          <div className="space-y-4">
            {displayList.map((h) => (
              <HackathonDBCard key={h.id} hackathon={h} showCountdown={activeTab === 'upcoming'} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              {activeTab === 'upcoming' ? (
                <Rocket size={24} className="text-gray-500" />
              ) : (
                <History size={24} className="text-gray-500" />
              )}
            </div>
            <h3 className="font-sora text-lg font-semibold text-gray-400 mb-2">
              {activeTab === 'upcoming' ? '暂无即将举办的黑客松' : '暂无已结束的黑客松'}
            </h3>
            <p className="font-space-mono text-sm text-gray-500">尝试调整搜索关键词或筛选条件</p>
          </div>
        )}
      </div>

      {/* 查看全部入口 */}
      <div className="mt-10 text-center max-w-[1440px] mx-auto px-6 lg:px-10 pb-16 md:pb-24">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-space-mono text-sm text-gray-400 transition-all hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
        >
          在 Explore 页面查看更多
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
