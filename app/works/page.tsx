'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingBlob } from '@/components/ui/FloatingBlob';
import { fadeInUp } from '@/lib/animations';
import {
  Search, Trophy, Github, Globe, ExternalLink, CheckCircle, Plus, Users,
} from 'lucide-react';

interface Work {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  coverImage: string | null;
  techStack: string[];
  awards: { name: string }[];
  hackathonName: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  screenshots: string[];
  verificationStatus: string;
  createdAt: string;
}

export default function WorksGalleryPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/works?status=approved&limit=50')
      .then((r) => r.json())
      .then(({ data }) => setWorks(data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return works;
    const q = searchQuery.toLowerCase();
    return works.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.tagline?.toLowerCase().includes(q) ||
        w.hackathonName?.toLowerCase().includes(q) ||
        w.techStack?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [works, searchQuery]);

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
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
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs font-mono text-purple-300 tracking-wider">SHOWCASE</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  作品展示
                </h1>
                <p className="text-xl text-gray-400 font-light">
                  来自全球黑客松的 <span className="text-purple-300">优秀作品</span>
                </p>
              </div>
              <Link
                href="/works/submit"
                className="hidden md:flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <Plus size={18} /> 提交作品
              </Link>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <div className="relative max-w-xl">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="搜索作品名称、技术栈、黑客松..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(124,93,255,0.2)] transition-all font-light"
              />
            </div>
          </motion.div>

          {/* Works Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-4">
                {searchQuery ? '没有找到匹配的作品' : '暂时还没有作品'}
              </p>
              <Link
                href="/works/submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <Plus size={16} /> 成为第一个
              </Link>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((w) => (
                <motion.div
                  key={w.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Link href={`/works/${w.id}`}>
                    <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-300">
                      {/* Verified badge */}
                      {w.verificationStatus === 'approved' && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                          <CheckCircle size={12} className="text-green-400" />
                          <span className="text-[10px] text-green-400 font-medium">已验证</span>
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-white mb-1 pr-16 group-hover:text-purple-300 transition-colors">
                        {w.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {w.tagline || w.description?.slice(0, 80) || ''}
                      </p>

                      {/* Hackathon */}
                      {w.hackathonName && (
                        <div className="mb-3">
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                            {w.hackathonName}
                          </span>
                        </div>
                      )}

                      {/* Awards */}
                      {w.awards?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(w.awards as { name: string }[]).map((a, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 text-xs">
                              <Trophy size={10} /> {a.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tech stack */}
                      {w.techStack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(w.techStack as string[]).slice(0, 4).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px]">
                              {t}
                            </span>
                          ))}
                          {(w.techStack as string[]).length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-[11px]">
                              +{(w.techStack as string[]).length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex gap-3 text-gray-500 text-sm">
                        {w.repoUrl && (
                          <span className="flex items-center gap-1"><Github size={14} /> Code</span>
                        )}
                        {w.demoUrl && (
                          <span className="flex items-center gap-1"><Globe size={14} /> Demo</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Mobile CTA */}
          <div className="md:hidden fixed bottom-6 right-6 z-30">
            <Link
              href="/works/submit"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/40"
            >
              <Plus size={18} /> 提交作品
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
