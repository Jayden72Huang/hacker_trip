import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentMessages, agentSessions, agentTeamMembers } from '@/lib/db/schema';
import { eq, and, lt, desc, asc } from 'drizzle-orm';

// GET /api/agent/sessions/:id/messages?limit=50&before=timestamp
// Supports pagination: returns messages in chronological order.
// If `before` is provided, returns messages older than that timestamp.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);
    const before = searchParams.get('before');

    // Get the agent session to find teamId
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

    // Build query with optional pagination
    const conditions = [eq(agentMessages.sessionId, sessionId)];
    if (before) {
      conditions.push(lt(agentMessages.createdAt, new Date(before)));
    }

    // Fetch in reverse chronological order, then reverse for display
    const messages = await db
      .select()
      .from(agentMessages)
      .where(and(...conditions))
      .orderBy(desc(agentMessages.createdAt))
      .limit(limit);

    // Reverse to chronological order
    messages.reverse();

    // Check if there are more messages before the oldest one
    const hasMore = messages.length === limit;

    return NextResponse.json({ messages, hasMore });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}

// POST /api/agent/sessions/:id/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const { content, skillName, role: requestedRole } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

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

    // If the request is for an assistant message (e.g., welcome message), insert directly
    if (requestedRole === 'assistant') {
      const [assistantMessage] = await db
        .insert(agentMessages)
        .values({
          sessionId,
          role: 'assistant',
          content,
          skillName: skillName || null,
        })
        .returning();

      return NextResponse.json({ message: assistantMessage });
    }

    // Save user message
    const [userMessage] = await db
      .insert(agentMessages)
      .values({
        sessionId,
        role: 'user',
        content,
        userId: session.user.id,
        skillName: skillName || null,
      })
      .returning();

    // TODO: Forward message to OpenClaw Gateway via SSE
    // and stream back the assistant response.
    // For now, return a placeholder response.
    const [botMessage] = await db
      .insert(agentMessages)
      .values({
        sessionId,
        role: 'assistant',
        content: '收到！OpenClaw Gateway 集成后将在此返回 AI 回复。',
        skillName: skillName || agentSession.activeSkill,
      })
      .returning();

    return NextResponse.json({
      userMessage,
      botMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 });
  }
}
