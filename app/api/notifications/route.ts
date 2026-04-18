import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/notifications — 获取当前用户的通知列表
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json(list);
}

/**
 * PATCH /api/notifications — 标记当前用户所有未读通知为已读
 */
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
      )
    );

  return NextResponse.json({ success: true });
}
