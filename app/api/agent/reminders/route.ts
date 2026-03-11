import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentReminders, agentTeamMembers } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';

// GET /api/agent/reminders?teamId=xxx - Get due reminders for a team
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: '缺少 teamId 参数' }, { status: 400 });
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      );

    if (!membership) {
      return NextResponse.json({ error: '无权限访问该团队' }, { status: 403 });
    }

    // Fetch pending reminders that are due (remind_at <= now)
    const now = new Date();
    const dueReminders = await db
      .select()
      .from(agentReminders)
      .where(
        and(
          eq(agentReminders.teamId, teamId),
          eq(agentReminders.status, 'pending'),
          lte(agentReminders.remindAt, now)
        )
      );

    return NextResponse.json({ reminders: dueReminders });
  } catch (error) {
    console.error('[reminders/GET]', error);
    return NextResponse.json(
      { error: '获取提醒失败' },
      { status: 500 }
    );
  }
}
