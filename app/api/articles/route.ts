import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users, hackathons } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// GET /api/articles
// ?mine=true — 返回当前用户的文章（需登录）
// ?slug=xxx — 获取单篇已发布文章并增加浏览量
// 默认 — 返回所有已发布文章
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine');
  const slug = searchParams.get('slug');

  // 单篇文章查询
  if (slug) {
    const [result] = await db
      .select({
        article: articles,
        authorName: users.name,
        authorImage: users.image,
        authorBio: users.bio,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    // 增加浏览量
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, result.article.id));

    // 关联黑客松
    let hackathon = null;
    if (result.article.relatedHackathonId) {
      const [h] = await db
        .select({ id: hackathons.id, name: hackathons.name, slug: hackathons.slug })
        .from(hackathons)
        .where(eq(hackathons.id, result.article.relatedHackathonId))
        .limit(1);
      hackathon = h || null;
    }

    return NextResponse.json({ data: { ...result, hackathon } });
  }

  // 当前用户的文章
  if (mine === 'true') {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const data = await db
      .select({
        article: articles,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.authorId, session.user.id))
      .orderBy(desc(articles.createdAt));

    return NextResponse.json({ data });
  }

  // 公开：只返回 published
  const data = await db
    .select({
      article: articles,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt));

  return NextResponse.json({ data });
}
