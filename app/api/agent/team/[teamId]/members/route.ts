import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/agent/team/:teamId/members - Add member to team
export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId } = await params;
    const { userId, role = 'member' } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
    }

    // Verify requester is team leader
    const [requesterMembership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!requesterMembership || requesterMembership.role !== 'leader') {
      return NextResponse.json({ error: '只有队长可以添加成员' }, { status: 403 });
    }

    // Verify target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // Check if already a member
    const [existing] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: '该用户已是团队成员' }, { status: 409 });
    }

    await db.insert(agentTeamMembers).values({
      teamId,
      userId,
      role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json({ error: '添加成员失败' }, { status: 500 });
  }
}

// DELETE /api/agent/team/:teamId/members - Remove member from team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
    }

    // Verify requester is team leader
    const [requesterMembership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!requesterMembership || requesterMembership.role !== 'leader') {
      return NextResponse.json({ error: '只有队长可以移除成员' }, { status: 403 });
    }

    // Cannot remove yourself (leader)
    if (userId === session.user.id) {
      return NextResponse.json({ error: '队长不能移除自己' }, { status: 400 });
    }

    await db
      .delete(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: '移除成员失败' }, { status: 500 });
  }
}
