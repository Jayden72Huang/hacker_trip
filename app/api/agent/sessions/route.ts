import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentSessions, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/agent/sessions?teamId=xxx - List sessions for a team
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
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const sessions = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.teamId, teamId))
      .orderBy(agentSessions.createdAt);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}

// POST /api/agent/sessions - Create a new session
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId, channelType = 'webchat' } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: '缺少 teamId' }, { status: 400 });
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
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const [newSession] = await db
      .insert(agentSessions)
      .values({
        teamId,
        channelType,
        status: 'active',
      })
      .returning();

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
  }
}
