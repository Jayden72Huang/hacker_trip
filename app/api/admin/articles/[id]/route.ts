import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/admin/articles/[id] — 审核文章（approve/reject/feature）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body; // action: 'approve' | 'reject' | 'feature' | 'unfeature'

  const [existing] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  if (action === 'approve') {
    const [updated] = await db
      .update(articles)
      .set({
        status: 'published',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return NextResponse.json({ data: updated });
  }

  if (action === 'reject') {
    const [updated] = await db
      .update(articles)
      .set({
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return NextResponse.json({ data: updated });
  }

  if (action === 'feature') {
    const [updated] = await db
      .update(articles)
      .set({
        isFeatured: true,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return NextResponse.json({ data: updated });
  }

  if (action === 'unfeature') {
    const [updated] = await db
      .update(articles)
      .set({
        isFeatured: false,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return NextResponse.json({ data: updated });
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}
