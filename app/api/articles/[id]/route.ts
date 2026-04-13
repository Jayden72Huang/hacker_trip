import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/articles/[id] — 作者更新文章内容（仅 draft/invited 状态）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, subtitle, content, excerpt, coverImage, tags } = body;

  // 查找文章，必须是作者本人
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.authorId, session.user.id)))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: '文章不存在或无权操作' }, { status: 404 });
  }

  if (article.status !== 'draft' && article.status !== 'invited') {
    return NextResponse.json({ error: '当前状态不允许编辑' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (content !== undefined) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (coverImage !== undefined) updateData.coverImage = coverImage;
  if (tags !== undefined) updateData.tags = tags;

  // 如果从 invited 状态开始编辑，自动转为 draft
  if (article.status === 'invited') {
    updateData.status = 'draft';
  }

  const [updated] = await db
    .update(articles)
    .set(updateData)
    .where(eq(articles.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}
