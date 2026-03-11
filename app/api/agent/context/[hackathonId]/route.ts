import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hackathons, agentTeams, agentTeamMembers, agentArtifacts, agentTaskBoards, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/agent/context/:hackathonId?teamId=xxx - Load full context for agent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { hackathonId } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    // Load hackathon data
    const [hackathon] = await db
      .select()
      .from(hackathons)
      .where(eq(hackathons.id, hackathonId))
      .limit(1);

    if (!hackathon) {
      return NextResponse.json({ error: '黑客松不存在' }, { status: 404 });
    }

    let team = null;
    let members: Array<Record<string, unknown>> = [];
    let artifacts: Array<Record<string, unknown>> = [];
    let tasks: Array<Record<string, unknown>> = [];

    if (teamId) {
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
        return NextResponse.json({ error: '无权访问该团队' }, { status: 403 });
      }

      // Load team
      const [teamData] = await db
        .select()
        .from(agentTeams)
        .where(eq(agentTeams.id, teamId))
        .limit(1);
      team = teamData;

      // Load members with profiles
      members = await db
        .select({
          userId: agentTeamMembers.userId,
          role: agentTeamMembers.role,
          name: users.name,
          skills: users.skills,
          experienceLevel: users.experienceLevel,
          github: users.github,
          interests: users.interests,
        })
        .from(agentTeamMembers)
        .innerJoin(users, eq(agentTeamMembers.userId, users.id))
        .where(eq(agentTeamMembers.teamId, teamId));

      // Load artifacts
      artifacts = await db
        .select()
        .from(agentArtifacts)
        .where(eq(agentArtifacts.teamId, teamId))
        .orderBy(agentArtifacts.createdAt);

      // Load tasks
      tasks = await db
        .select()
        .from(agentTaskBoards)
        .where(eq(agentTaskBoards.teamId, teamId))
        .orderBy(agentTaskBoards.createdAt);
    }

    return NextResponse.json({
      hackathon: {
        id: hackathon.id,
        name: hackathon.name,
        description: hackathon.description,
        startDate: hackathon.startDate,
        endDate: hackathon.endDate,
        registrationDeadline: hackathon.registrationDeadline,
        mode: hackathon.mode,
        location: hackathon.location,
        tracks: hackathon.tracks,
        prizes: hackathon.prizes,
        prizePool: hackathon.prizePool,
        tags: hackathon.tags,
        techStack: hackathon.techStack,
        organizer: hackathon.organizer,
        status: hackathon.status,
        website: hackathon.website,
      },
      team,
      members,
      artifacts,
      tasks,
    });
  } catch (error) {
    console.error('Get agent context error:', error);
    return NextResponse.json({ error: '获取上下文失败' }, { status: 500 });
  }
}
