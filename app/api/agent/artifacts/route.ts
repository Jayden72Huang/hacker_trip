import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentArtifacts, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/agent/artifacts?teamId=xxx - List artifacts for a team
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

    const artifacts = await db
      .select()
      .from(agentArtifacts)
      .where(eq(agentArtifacts.teamId, teamId))
      .orderBy(agentArtifacts.createdAt);

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error('Get artifacts error:', error);
    return NextResponse.json({ error: '获取生成物失败' }, { status: 500 });
  }
}

// POST /api/agent/artifacts - Create an artifact
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { sessionId, teamId, type, title, content, structuredData, isPinned } =
      await request.json();

    if (!sessionId || !teamId || !type || !title || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
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

    const [artifact] = await db
      .insert(agentArtifacts)
      .values({
        sessionId,
        teamId,
        type,
        title,
        content,
        structuredData: structuredData || null,
        isPinned: isPinned || false,
      })
      .returning();

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error('Create artifact error:', error);
    return NextResponse.json({ error: '创建生成物失败' }, { status: 500 });
  }
}
