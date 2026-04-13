'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingBlob } from '@/components/ui/FloatingBlob';
import { fadeInUp } from '@/lib/animations';
import { Search, FileText, Eye, Star, Calendar, User } from 'lucide-react';

interface ArticleCard {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    type: 'experience' | 'interview' | 'guest_post';
    coverImage: string | null;
    excerpt: string | null;
    content: string;
    tags: string[];
    isFeatured: boolean;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
  };
  authorName: string | null;
  authorImage: string | null;
}

const typeLabels: Record<string, string> = {
  experience: '参赛经验',
  interview: '获奖访谈',
  guest_post: '嘉宾专栏',
};

const typeColors: Record<string, string> = {
  experience: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  interview: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  guest_post: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then(({ data }) => setArticles(data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = articles;
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.article.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.article.title.toLowerCase().includes(q) ||
          a.article.excerpt?.toLowerCase().includes(q) ||
          a.authorName?.toLowerCase().includes(q) ||
          (a.article.tags as string[])?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, searchQuery, typeFilter]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

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
                <span className="text-xs font-mono text-purple-300 tracking-wider">ARTICLES</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  专栏文章
                </h1>
                <p className="text-xl text-gray-400 font-light">
                  来自社区的 <span className="text-purple-300">参赛经验</span> 与 <span className="text-cyan-300">获奖访谈</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10 flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1 max-w-xl">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="搜索标题、作者、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(124,93,255,0.2)] transition-all font-light"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'experience', 'interview', 'guest_post'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    typeFilter === t
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {t === 'all' ? '全部' : typeLabels[t]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">
                {searchQuery || typeFilter !== 'all' ? '没有找到匹配的文章' : '暂时还没有文章'}
              </p>
              <p className="text-gray-600 text-sm">敬请期待社区精彩内容</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map(({ article: a, authorName, authorImage }) => (
                <motion.div
                  key={a.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Link href={`/community/articles/${a.slug}`}>
                    <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-300 h-full flex flex-col">
                      {/* Cover image */}
                      {a.coverImage && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/5">
                          <img
                            src={a.coverImage}
                            alt={a.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Featured badge */}
                      {a.isFeatured && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                          <Star size={12} className="text-yellow-400" />
                          <span className="text-[10px] text-yellow-400 font-medium">精选</span>
                        </div>
                      )}

                      {/* Type badge */}
                      <div className="mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${typeColors[a.type] || ''}`}>
                          {typeLabels[a.type] || a.type}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                        {a.title}
                      </h3>

                      {(a.excerpt || a.content) && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                          {a.excerpt || a.content.slice(0, 120)}
                        </p>
                      )}

                      {/* Tags */}
                      {(a.tags as string[])?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(a.tags as string[]).slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-[11px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-gray-500 text-sm mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {authorImage ? (
                            <img src={authorImage} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <User size={14} />
                          )}
                          <span>{authorName || '匿名'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(a.publishedAt)}
                          </span>
                          {a.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {a.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
