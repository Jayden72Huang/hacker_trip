import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentReminders, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/agent/reminders/[id] - Dismiss a reminder
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    // Find the reminder
    const [reminder] = await db
      .select()
      .from(agentReminders)
      .where(eq(agentReminders.id, id));

    if (!reminder) {
      return NextResponse.json({ error: '提醒不存在' }, { status: 404 });
    }

    // Verify team membership
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, reminder.teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      );

    if (!membership) {
      return NextResponse.json({ error: '无权限操作' }, { status: 403 });
    }

    // Update status to dismissed
    const [updated] = await db
      .update(agentReminders)
      .set({
        status: 'dismissed',
        triggeredAt: new Date(),
      })
      .where(eq(agentReminders.id, id))
      .returning();

    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error('[reminders/PATCH]', error);
    return NextResponse.json(
      { error: '更新提醒失败' },
      { status: 500 }
    );
  }
}
