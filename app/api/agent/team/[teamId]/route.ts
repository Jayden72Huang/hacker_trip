import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers, hackathons, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/agent/team/:teamId - Get team detail with members
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId } = await params;

    // Get team
    const [team] = await db
      .select()
      .from(agentTeams)
      .where(eq(agentTeams.id, teamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(eq(agentTeamMembers.teamId, teamId))
      .limit(100);

    // Get all members with their user profiles
    const members = await db
      .select({
        userId: agentTeamMembers.userId,
        role: agentTeamMembers.role,
        joinedAt: agentTeamMembers.joinedAt,
        name: users.name,
        image: users.image,
        skills: users.skills,
        experienceLevel: users.experienceLevel,
        github: users.github,
      })
      .from(agentTeamMembers)
      .innerJoin(users, eq(agentTeamMembers.userId, users.id))
      .where(eq(agentTeamMembers.teamId, teamId));

    const isMember = members.some((m) => m.userId === session.user!.id);
    if (!isMember) {
      return NextResponse.json({ error: '无权访问该团队' }, { status: 403 });
    }

    return NextResponse.json({ team, members });
  } catch (error) {
    console.error('Get team detail error:', error);
    return NextResponse.json({ error: '获取团队详情失败' }, { status: 500 });
  }
}

// PATCH /api/agent/team/:teamId - Update team info
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();

    // Verify the user is a member (ideally leader, but allow any member for now)
    const [membership] = await db
      .select()
      .from(agentTeamMembers)
      .where(eq(agentTeamMembers.teamId, teamId))
      .limit(1);

    if (!membership || membership.userId !== session.user.id) {
      // Check if user is at least a member
      const members = await db
        .select({ userId: agentTeamMembers.userId })
        .from(agentTeamMembers)
        .where(eq(agentTeamMembers.teamId, teamId));

      const isMember = members.some((m) => m.userId === session.user!.id);
      if (!isMember) {
        return NextResponse.json({ error: '无权修改该团队' }, { status: 403 });
      }
    }

    // Build update fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.selectedTrack !== undefined) updateData.selectedTrack = body.selectedTrack;
    if (body.selectedIdea !== undefined) updateData.selectedIdea = body.selectedIdea;

    // Handle hackathon linking: verify FK exists in DB, otherwise save name only
    if (body.hackathonId !== undefined) {
      if (body.hackathonId) {
        const [existing] = await db
          .select({ id: hackathons.id })
          .from(hackathons)
          .where(eq(hackathons.id, body.hackathonId))
          .limit(1);

        if (existing) {
          updateData.hackathonId = body.hackathonId;
        } else {
          // ID not in DB (e.g. from static data), save null to avoid FK error
          updateData.hackathonId = null;
        }
      } else {
        updateData.hackathonId = null;
      }
    }
    if (body.hackathonName !== undefined) updateData.hackathonName = body.hackathonName;

    // API key configuration
    if (body.anthropicApiKey !== undefined) updateData.anthropicApiKey = body.anthropicApiKey || null;
    if (body.openclawApiKey !== undefined) updateData.openclawApiKey = body.openclawApiKey || null;

    // Multi-provider LLM configuration
    if (body.llmProvider !== undefined) updateData.llmProvider = body.llmProvider || null;
    if (body.llmApiKey !== undefined) updateData.llmApiKey = body.llmApiKey || null;
    if (body.llmBaseUrl !== undefined) updateData.llmBaseUrl = body.llmBaseUrl || null;

    const [updated] = await db
      .update(agentTeams)
      .set(updateData)
      .where(eq(agentTeams.id, teamId))
      .returning();

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: '更新团队失败' }, { status: 500 });
  }
}
