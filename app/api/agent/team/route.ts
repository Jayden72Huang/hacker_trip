import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/agent/team - List user's teams
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Find teams where user is a member
    const memberships = await db
      .select({
        teamId: agentTeamMembers.teamId,
        role: agentTeamMembers.role,
      })
      .from(agentTeamMembers)
      .where(eq(agentTeamMembers.userId, session.user.id));

    if (memberships.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const teamIds = memberships.map((m) => m.teamId);
    const teams = await db
      .select()
      .from(agentTeams)
      .where(eq(agentTeams.status, 'active'));

    const userTeams = teams.filter((t) => teamIds.includes(t.id));

    return NextResponse.json({ teams: userTeams });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json({ error: '获取团队失败' }, { status: 500 });
  }
}

// POST /api/agent/team - Create a new team
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { name, hackathonId, hackathonName } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '团队名称不能为空' }, { status: 400 });
    }

    // Create team
    const [team] = await db
      .insert(agentTeams)
      .values({
        name,
        hackathonId: hackathonId || null,
        hackathonName: hackathonName || null,
        createdBy: session.user.id,
      })
      .returning();

    // Add creator as team leader
    await db.insert(agentTeamMembers).values({
      teamId: team.id,
      userId: session.user.id,
      role: 'leader',
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: '创建团队失败' }, { status: 500 });
  }
}
