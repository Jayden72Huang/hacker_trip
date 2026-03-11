import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTaskBoards, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/agent/tasks?teamId=xxx - Get task board for a team
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

    const tasks = await db
      .select()
      .from(agentTaskBoards)
      .where(eq(agentTaskBoards.teamId, teamId))
      .orderBy(agentTaskBoards.createdAt);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: '获取任务失败' }, { status: 500 });
  }
}

// POST /api/agent/tasks - Create a task
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const {
      teamId,
      taskId,
      title,
      description,
      priority = 'p1',
      assigneeId,
      estimatedHours,
      dependencies,
      module,
      dueAt,
    } = await request.json();

    if (!teamId || !taskId || !title) {
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

    const [task] = await db
      .insert(agentTaskBoards)
      .values({
        teamId,
        taskId,
        title,
        description: description || null,
        priority,
        assigneeId: assigneeId || null,
        estimatedHours: estimatedHours || null,
        dependencies: dependencies || [],
        module: module || null,
        dueAt: dueAt ? new Date(dueAt) : null,
      })
      .returning();

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 });
  }
}

// PATCH /api/agent/tasks - Update task status
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id, status, assigneeId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少任务 ID' }, { status: 400 });
    }

    // Get task to verify team membership
    const [task] = await db
      .select()
      .from(agentTaskBoards)
      .where(eq(agentTaskBoards.id, id))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, task.teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (status === 'done') updateData.completedAt = new Date();

    const [updated] = await db
      .update(agentTaskBoards)
      .set(updateData)
      .where(eq(agentTaskBoards.id, id))
      .returning();

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 });
  }
}
