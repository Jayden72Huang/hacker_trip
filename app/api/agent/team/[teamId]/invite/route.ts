import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';

const INVITE_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'hackerbot-invite-fallback-secret'
);

// POST /api/agent/team/:teamId/invite - Generate invite link
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { teamId } = await params;

    // Verify user is team leader
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

    // Generate a signed invite token (valid for 24 hours)
    const token = await new SignJWT({ teamId, invitedBy: session.user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(INVITE_SECRET);

    const inviteUrl = `${process.env.NEXTAUTH_URL || 'https://hacker-trip.com'}/hacker-bot?invite=${token}`;

    return NextResponse.json({ inviteUrl, token });
  } catch (error) {
    console.error('Generate invite error:', error);
    return NextResponse.json({ error: '生成邀请链接失败' }, { status: 500 });
  }
}

// PUT /api/agent/team/:teamId/invite - Accept invite (join team via token)
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: '缺少邀请令牌' }, { status: 400 });
    }

    // Verify the token
    const { payload } = await jwtVerify(token, INVITE_SECRET);
    const teamId = payload.teamId as string;

    if (!teamId) {
      return NextResponse.json({ error: '无效的邀请链接' }, { status: 400 });
    }

    // Check if team exists
    const [team] = await db
      .select()
      .from(agentTeams)
      .where(eq(agentTeams.id, teamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // Check if already a member
    const [existing] = await db
      .select()
      .from(agentTeamMembers)
      .where(
        and(
          eq(agentTeamMembers.teamId, teamId),
          eq(agentTeamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ message: '你已经是团队成员', team });
    }

    // Add as member
    await db.insert(agentTeamMembers).values({
      teamId,
      userId: session.user.id,
      role: 'member',
    });

    return NextResponse.json({ message: '成功加入团队', team });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return NextResponse.json({ error: '邀请链接已过期' }, { status: 400 });
    }
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: '加入团队失败' }, { status: 500 });
  }
}
