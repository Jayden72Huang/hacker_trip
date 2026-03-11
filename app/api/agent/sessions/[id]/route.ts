import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentSessions, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/agent/sessions/:id - Update session fields (activeSkill, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();

    // Get the agent session
    const [agentSession] = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId))
      .limit(1);

    if (!agentSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, agentSession.teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    // Build update object from allowed fields
    const updates: Record<string, unknown> = {};
    if ('activeSkill' in body) {
      updates.activeSkill = body.activeSkill;
    }
    if ('status' in body) {
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    const [updated] = await db
      .update(agentSessions)
      .set(updates)
      .where(eq(agentSessions.id, sessionId))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: '更新会话失败' }, { status: 500 });
  }
}
