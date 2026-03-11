import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  agentTeams,
  agentTeamMembers,
  agentSessions,
  agentMessages,
  agentArtifacts,
  users,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const WELCOME_MESSAGE_CONTENT = `Hey! 我是 **Hacker_Bot**，你的黑客松 AI 数字队友 🤖\n\n我可以帮你：\n- **/analyze** — 分析赛题、规则和评分标准\n- **/brainstorm** — 一起脑暴项目想法\n- **/plan** — 规划任务、分工和排期\n- **/resources** — 找开源项目、框架和工具\n- **/pitch** — 准备路演材料和 Demo 脚本\n\n先告诉我，你在参加哪个黑客松？可以发我比赛链接或者描述一下比赛。`;

// GET /api/agent/init - Single endpoint to initialize HackerBot
// Returns: team, session, messages, artifacts, members in one request
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 1: Find user's team
    const memberships = await db
      .select({ teamId: agentTeamMembers.teamId })
      .from(agentTeamMembers)
      .where(eq(agentTeamMembers.userId, userId));

    if (memberships.length === 0) {
      return NextResponse.json({ needsOnboarding: true });
    }

    const teamIds = memberships.map((m) => m.teamId);
    const allTeams = await db
      .select()
      .from(agentTeams)
      .where(eq(agentTeams.status, 'active'));

    const team = allTeams.find((t) => teamIds.includes(t.id));

    if (!team) {
      return NextResponse.json({ needsOnboarding: true });
    }

    // Step 2: Get or create active session
    // Use simpler query - find sessions by teamId, then filter in JS
    const teamSessions = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.teamId, team.id))
      .orderBy(desc(agentSessions.createdAt));

    let agentSession = teamSessions.find((s) => s.status === 'active');
    let isNewSession = false;

    if (!agentSession) {
      const [created] = await db
        .insert(agentSessions)
        .values({
          teamId: team.id,
          channelType: 'webchat',
        })
        .returning();
      agentSession = created;
      isNewSession = true;
    }

    // Step 3: Load messages, artifacts, and members in parallel
    const [messagesResult, artifactsResult, membersResult] = await Promise.all([
      db
        .select()
        .from(agentMessages)
        .where(eq(agentMessages.sessionId, agentSession.id))
        .orderBy(desc(agentMessages.createdAt))
        .limit(50),
      db
        .select()
        .from(agentArtifacts)
        .where(eq(agentArtifacts.teamId, team.id))
        .orderBy(agentArtifacts.createdAt),
      db
        .select({
          userId: agentTeamMembers.userId,
          role: agentTeamMembers.role,
          joinedAt: agentTeamMembers.joinedAt,
          name: users.name,
          image: users.image,
        })
        .from(agentTeamMembers)
        .innerJoin(users, eq(agentTeamMembers.userId, users.id))
        .where(eq(agentTeamMembers.teamId, team.id)),
    ]);

    // Reverse messages to chronological order
    messagesResult.reverse();

    // Insert welcome message for new sessions
    if (isNewSession && messagesResult.length === 0) {
      const [welcomeMsg] = await db
        .insert(agentMessages)
        .values({
          sessionId: agentSession.id,
          role: 'assistant',
          content: WELCOME_MESSAGE_CONTENT,
        })
        .returning();
      messagesResult.push(welcomeMsg);
    }

    // Build hackathon info (name is sufficient, ID may be null for static data)
    let hackathon = null;
    if (team.hackathonName) {
      hackathon = {
        id: team.hackathonId || null,
        name: team.hackathonName,
      };
    }

    return NextResponse.json({
      needsOnboarding: false,
      team: {
        id: team.id,
        name: team.name,
        apiKeyStatus: {
          anthropic: !!team.anthropicApiKey,
          openclaw: !!team.openclawApiKey,
          anthropicLast4: team.anthropicApiKey ? team.anthropicApiKey.slice(-4) : null,
          openclawLast4: team.openclawApiKey ? team.openclawApiKey.slice(-4) : null,
          provider: team.llmProvider || null,
          providerKey: !!team.llmApiKey,
          providerKeyLast4: team.llmApiKey ? team.llmApiKey.slice(-4) : null,
          providerBaseUrl: team.llmBaseUrl || null,
        },
      },
      session: {
        id: agentSession.id,
      },
      messages: messagesResult,
      artifacts: artifactsResult,
      members: membersResult,
      hackathon,
    });
  } catch (error) {
    console.error('HackerBot init error:', error);
    const message = error instanceof Error ? error.message : '初始化失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
