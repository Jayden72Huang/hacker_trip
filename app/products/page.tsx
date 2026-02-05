'use client';

import { useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { projects } from '@/data/projects';
import { hackathons } from '@/data/hackathons';
import {
  Flame,
  Trophy,
  Medal,
  Filter,
  ChevronDown,
  Star,
  Eye,
  Heart,
  ArrowUpRight,
} from 'lucide-react';

type SortType = 'hot' | 'latest' | 'award';

export default function ProductsPage() {
  const [activeHackathon, setActiveHackathon] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [showSort, setShowSort] = useState(false);

  const sorted = useMemo(() => {
    let list = projects.filter((p) => activeHackathon === 'all' || p.hackathonId === activeHackathon);
    list = [...list].sort((a, b) => {
      if (sortBy === 'hot') return b.hotScore - a.hotScore;
      if (sortBy === 'latest') return b.views - a.views; // 视图充当“最近活跃”占位
      // award优先：有奖的在前，同级按hot
      const aHas = (a.awards?.length || 0) > 0;
      const bHas = (b.awards?.length || 0) > 0;
      if (aHas !== bHas) return Number(bHas) - Number(aHas);
      return b.hotScore - a.hotScore;
    });
    return list;
  }, [activeHackathon, sortBy]);

  const awardBoard = useMemo(() => {
    const grouped: Record<string, typeof projects> = {};
    projects.forEach((p) => {
      if (!p.awards?.length) return;
      grouped[p.hackathonId] = grouped[p.hackathonId] || [];
      grouped[p.hackathonId].push(p);
    });
    return grouped;
  }, []);

  const sortLabel = (s: SortType) =>
    s === 'hot' ? '热度优先' : s === 'latest' ? '活跃度' : '获奖优先';

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-40" aria-hidden />
      <Navbar />

      <main className="pt-36 pb-20">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 space-y-12">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl px-5 py-2 inline-flex items-center gap-2 w-fit">
              <Flame size={16} className="text-orange-400" />
              <span className="font-space-mono text-xs text-gray-300">产品热度榜 · 绑定黑客松/用户</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-sora text-3xl md:text-4xl font-bold text-white">作品与获奖榜单</h1>
                <p className="font-space-mono text-sm text-gray-400">按热度/获奖快速浏览，直达作品 Demo</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowSort((p) => !p)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-space-mono text-gray-300 hover:bg-white/10 transition-all"
                  >
                    <Filter size={14} />
                    {sortLabel(sortBy)}
                    <ChevronDown size={14} />
                  </button>
                  {showSort && (
                    <div className="absolute right-0 mt-2 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-10">
                      {(['hot', 'latest', 'award'] as SortType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSortBy(s);
                            setShowSort(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-space-mono transition-colors ${
                            sortBy === s ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {sortLabel(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto gap-2 max-w-[70vw] md:max-w-none">
                  <button
                    onClick={() => setActiveHackathon('all')}
                    className={`px-4 py-2 rounded-full border text-xs font-space-mono transition-all ${
                      activeHackathon === 'all'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    全部
                  </button>
                  {hackathons.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setActiveHackathon(h.id)}
                      className={`px-4 py-2 rounded-full border text-xs font-space-mono transition-all whitespace-nowrap ${
                        activeHackathon === h.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {h.shortName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hot leaderboard */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Flame size={18} className="text-orange-400" />
              <h2 className="font-sora text-xl font-semibold text-white">热度榜</h2>
              <span className="text-xs font-space-mono text-gray-500">按 {sortLabel(sortBy)}</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((p, idx) => (
                <div key={p.id} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-indigo-500/40 transition-all">
                  <div className="absolute -top-3 left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <span className="font-sora text-lg font-bold text-white">#{idx + 1}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-white font-sora font-bold">
                      {p.name[0]}
                    </div>
                    <div>
                      <h3 className="font-sora text-lg font-semibold text-white">{p.name}</h3>
                      <p className="text-xs font-space-mono text-gray-500">{p.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-200 text-[11px] font-space-mono">
                      {p.hackathonName}
                    </span>
                    {p.awards?.map((a) => (
                      <span key={a.title} className="px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-200 text-[11px] font-space-mono inline-flex items-center gap-1">
                        <Trophy size={12} /> {a.title}
                      </span>
                    ))}
                    {p.tracks.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-1 rounded-full bg-white/5 text-gray-300 text-[11px] font-space-mono">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-white/5 py-2 border border-white/10">
                      <div className="text-xs text-gray-500 font-space-mono">热度</div>
                      <div className="font-sora text-lg text-white">{p.hotScore}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-2 border border-white/10">
                      <div className="text-xs text-gray-500 font-space-mono inline-flex items-center gap-1 justify-center"><Heart size={12}/>赞</div>
                      <div className="font-sora text-lg text-white">{p.likes}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-2 border border-white/10">
                      <div className="text-xs text-gray-500 font-space-mono inline-flex items-center gap-1 justify-center"><Eye size={12}/>浏览</div>
                      <div className="font-sora text-lg text-white">{p.views}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={p.user.avatar || '/avatars/default.png'}
                        alt={p.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">{p.user.name}</p>
                        <p className="text-xs text-gray-500 font-space-mono">{p.user.title || 'Builder'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {p.demoUrl && (
                        <a href={p.demoUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-space-mono text-gray-300 hover:bg-white/10 flex items-center gap-1">
                          Demo <ArrowUpRight size={12}/>
                        </a>
                      )}
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-space-mono text-gray-300 hover:bg-white/10">
                          Repo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Award boards */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Medal size={18} className="text-amber-400" />
              <h2 className="font-sora text-xl font-semibold text-white">按比赛查看获奖榜</h2>
            </div>
            <div className="space-y-4">
              {hackathons.map((h) => {
                const winners = awardBoard[h.id] || [];
                if (!winners.length) return null;
                return (
                  <div key={h.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-400" />
                        <p className="font-sora text-lg text-white">{h.name}</p>
                        <span className="text-xs font-space-mono text-gray-500">{h.dateRange}</span>
                      </div>
                      <span className="text-xs font-space-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
                        {winners.length} 个获奖作品
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {winners.map((p) => (
                        <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-indigo-500/40 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-white font-sora font-semibold">
                              <Trophy size={16} />
                            </div>
                            <div>
                              <p className="font-sora text-sm text-white">{p.name}</p>
                              <p className="text-[11px] text-gray-500 font-space-mono">{p.tagline}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {p.awards?.map((a) => (
                                  <span key={a.title} className="px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-200 text-[10px] font-space-mono">
                                    {a.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-space-mono">
                              <img src={p.user.avatar || '/avatars/default.png'} className="w-6 h-6 rounded-full object-cover border border-white/10" alt={p.user.name}/>
                              {p.user.name}
                            </div>
                            {p.demoUrl && (
                              <a href={p.demoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-300 hover:text-indigo-200 font-space-mono inline-flex items-center gap-1">
                                Demo <ArrowUpRight size={12}/>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
