import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/articles/[id]/submit — 提交文章审核
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.authorId, session.user.id)))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: '文章不存在或无权操作' }, { status: 404 });
  }

  if (article.status !== 'draft' && article.status !== 'invited') {
    return NextResponse.json({ error: '当前状态不允许提交审核' }, { status: 400 });
  }

  if (!article.title || !article.content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
  }

  const [updated] = await db
    .update(articles)
    .set({
      status: 'in_review',
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}
