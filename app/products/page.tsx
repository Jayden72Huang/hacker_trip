'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingBlob } from '@/components/ui/FloatingBlob';
import { projects } from '@/data/projects';
import { hackathons } from '@/data/hackathons';
import { fadeInUp, staggerContainer, cardItem, defaultViewport } from '@/lib/animations';
import {
  Flame,
  Trophy,
  ChevronDown,
  Eye,
  Heart,
  ExternalLink,
  Search,
  TrendingUp,
  Award,
} from 'lucide-react';

type SortType = 'hot' | 'latest' | 'award';

export default function ProductsPage() {
  const [activeHackathon, setActiveHackathon] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [showSort, setShowSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    let list = projects.filter((p) => activeHackathon === 'all' || p.hackathonId === activeHackathon);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.user.name.toLowerCase().includes(query) ||
        p.tracks.some((t) => t.toLowerCase().includes(query))
      );
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'hot') return b.hotScore - a.hotScore;
      if (sortBy === 'latest') return b.views - a.views;
      const aHas = (a.awards?.length || 0) > 0;
      const bHas = (b.awards?.length || 0) > 0;
      if (aHas !== bHas) return Number(bHas) - Number(aHas);
      return b.hotScore - a.hotScore;
    });
    return list;
  }, [activeHackathon, sortBy, searchQuery]);

  const sortLabel = (s: SortType) =>
    s === 'hot' ? '热度' : s === 'latest' ? '活跃度' : '获奖';

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Floating Blobs */}
      <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[5%] opacity-20">
          <FloatingBlob colors={['#7c5dff', '#c759ff', '#7c5dff']} size={600} duration={28} blur={120} />
        </div>
        <div className="absolute top-40 right-[10%] opacity-15">
          <FloatingBlob colors={['#4de1ff', '#7c5dff', '#4de1ff']} size={500} duration={35} blur={110} />
        </div>
      </div>

      <Navbar />

      <main className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs font-mono text-purple-300 tracking-wider">SHOWCASE</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              作品榜单
            </h1>
            <p className="text-xl text-gray-400 font-light">
              发现来自黑客松的{' '}
              <span className="text-purple-300">优秀作品</span>
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-xl">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="搜索作品名称、作者、赛道..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(124,93,255,0.2)] transition-all font-light"
              />
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            {/* Hackathon Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
              <button
                onClick={() => setActiveHackathon('all')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeHackathon === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                全部
              </button>
              {hackathons.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActiveHackathon(h.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeHackathon === h.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {h.shortName}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort((p) => !p)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium"
              >
                <TrendingUp size={16} />
                {sortLabel(sortBy)}
                <ChevronDown size={16} className={`transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-40 rounded-2xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden z-20 backdrop-blur-xl"
                >
                  {(['hot', 'latest', 'award'] as SortType[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSortBy(s);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm transition-all ${
                        sortBy === s
                          ? 'bg-purple-500/20 text-purple-300 font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {sortLabel(s)}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
          >
            {sorted.map((p, idx) => (
              <motion.div
                key={p.id}
                variants={cardItem}
              >
                <Link
                  href={`/products/${p.id}`}
                  className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(124,93,255,0.2)] hover:-translate-y-1"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 overflow-hidden">
                    {p.coverImage && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                        style={{ backgroundImage: `url(${p.coverImage})` }}
                      />
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                      <Flame size={14} className="text-orange-400" />
                      <span className="text-xs font-mono font-bold text-white">#{idx + 1}</span>
                    </div>

                    {/* Award Badge */}
                    {p.awards && p.awards.length > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 backdrop-blur-md border border-purple-500/30">
                        <Trophy size={12} className="text-purple-300" />
                        <span className="text-xs font-medium text-purple-200">{p.awards[0].title}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                      {p.tagline}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        {p.hackathonName.split(' ')[0]}
                      </span>
                      {p.tracks.slice(0, 1).map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/10">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.user.avatar || '/avatars/default.png'}
                          alt={p.user.name}
                          className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                        <span className="text-xs text-gray-400 font-medium">{p.user.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className="flex items-center gap-1.5 hover:text-pink-400 transition-colors cursor-pointer"
                        >
                          <Heart size={13} />
                          {p.likes}
                        </motion.span>
                        <span className="flex items-center gap-1.5">
                          <Eye size={13} />
                          {p.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {sorted.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Search size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-lg">暂无匹配作品</p>
              <p className="text-gray-600 text-sm mt-2">试试其他搜索条件</p>
            </motion.div>
          )}

          {/* Featured Award Winners */}
          {projects.filter((p) => p.awards && p.awards.length > 0).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-24"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Award className="text-purple-400" size={24} />
                  <h2 className="text-3xl font-bold text-white">获奖作品</h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects
                  .filter((p) => p.awards && p.awards.length > 0)
                  .slice(0, 4)
                  .map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link
                        href={`/products/${p.id}`}
                        className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(124,93,255,0.15)]"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Trophy size={20} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{p.awards?.[0].title}</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
