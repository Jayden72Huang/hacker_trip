import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { articles, users, hackathons } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Calendar, Eye, Star, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [result] = await db
    .select({
      article: articles,
      authorName: users.name,
      authorImage: users.image,
      authorBioUser: users.bio,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
    .limit(1);

  if (!result) notFound();

  // Increment view count
  await db
    .update(articles)
    .set({ viewCount: sql`${articles.viewCount} + 1` })
    .where(eq(articles.id, result.article.id));

  const a = result.article;

  // Fetch related hackathon if exists
  let hackathon: { id: string; name: string; slug: string } | null = null;
  if (a.relatedHackathonId) {
    const [h] = await db
      .select({ id: hackathons.id, name: hackathons.name, slug: hackathons.slug })
      .from(hackathons)
      .where(eq(hackathons.id, a.relatedHackathonId))
      .limit(1);
    hackathon = h || null;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
      <Navbar />

      <main className="relative pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/community/articles"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} /> 返回文章列表
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs border ${typeColors[a.type] || ''}`}>
                {typeLabels[a.type] || a.type}
              </span>
              {a.isFeatured && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-[10px] text-yellow-400 font-medium">精选</span>
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {a.title}
            </h1>
            {a.subtitle && (
              <p className="text-xl text-gray-400 font-light">{a.subtitle}</p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
            {/* Author */}
            <div className="flex items-center gap-3">
              {result.authorImage ? (
                <img src={result.authorImage} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
              )}
              <div>
                <div className="text-white font-medium">{result.authorName || '匿名'}</div>
                {(a.authorBio || result.authorBioUser) && (
                  <div className="text-gray-500 text-sm">{a.authorBio || result.authorBioUser}</div>
                )}
              </div>
            </div>

            <div className="flex-1" />

            {/* Date & views */}
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {formatDate(a.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={14} /> {(a.viewCount || 0) + 1}
              </span>
            </div>
          </div>

          {/* Cover image */}
          {a.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-white/10">
              <img src={a.coverImage} alt={a.title} className="w-full" />
            </div>
          )}

          {/* Related hackathon */}
          {hackathon && (
            <div className="mb-8">
              <Link
                href={`/hackathon/${hackathon.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                <ExternalLink size={14} />
                相关黑客松：{hackathon.name}
              </Link>
            </div>
          )}

          {/* Article content */}
          <div className="prose prose-invert prose-gray max-w-none mb-10">
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
              {a.content}
            </div>
          </div>

          {/* Tags */}
          {(a.tags as string[])?.length > 0 && (
            <div className="mb-10 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {(a.tags as string[]).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-sm border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-4">
              {result.authorImage ? (
                <img src={result.authorImage} alt="" className="w-14 h-14 rounded-full" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              )}
              <div>
                <div className="text-white font-semibold text-lg">{result.authorName || '匿名'}</div>
                {(a.authorBio || result.authorBioUser) && (
                  <div className="text-gray-400 text-sm mt-1">{a.authorBio || result.authorBioUser}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
