import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/notifications/[id] — 标记单条通知为已读
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // 确保通知属于当前用户
  const [notification] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id),
      )
    )
    .limit(1);

  if (!notification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));

  return NextResponse.json({ success: true });
}
