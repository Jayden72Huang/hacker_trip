import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  agentMessages,
  agentArtifacts,
  agentSessions,
  agentTeamMembers,
  agentTeams,
  hackathons,
  users,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { streamChat, type ChatMessage, type HackathonData } from '@/lib/openclaw/client';
import { hackathons as staticHackathons } from '@/data/hackathons';

export const runtime = 'nodejs';

/**
 * POST /api/agent/chat
 *
 * SSE streaming endpoint that bridges frontend to OpenClaw/Anthropic.
 * Saves messages to DB before and after streaming.
 *
 * Request body: { sessionId, content, skillName? }
 * Response: text/event-stream with events: token, artifact, done, error
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId, content, skillName } = await request.json();

    if (!sessionId || !content) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify session exists and user is a team member
    const [agentSession] = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId))
      .limit(1);

    if (!agentSession) {
      return new Response(
        JSON.stringify({ error: '会话不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      return new Response(
        JSON.stringify({ error: '无权访问' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Save user message to DB
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

    // 4. Load recent context (last 50 messages)
    const recentMessages = await db
      .select({
        role: agentMessages.role,
        content: agentMessages.content,
      })
      .from(agentMessages)
      .where(eq(agentMessages.sessionId, sessionId))
      .orderBy(desc(agentMessages.createdAt))
      .limit(50);

    // Reverse to chronological order
    const contextMessages: ChatMessage[] = recentMessages
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 5. Load team context
    const [team] = await db
      .select()
      .from(agentTeams)
      .where(eq(agentTeams.id, agentSession.teamId))
      .limit(1);

    const teamMembersData = await db
      .select({
        name: users.name,
        role: agentTeamMembers.role,
      })
      .from(agentTeamMembers)
      .innerJoin(users, eq(agentTeamMembers.userId, users.id))
      .where(eq(agentTeamMembers.teamId, agentSession.teamId));

    // 5b. Load hackathon data if team is linked to one
    let hackathonData: HackathonData | null = null;

    if (team?.hackathonId) {
      // Try loading from DB first (for organizer-created hackathons)
      const [h] = await db
        .select({
          name: hackathons.name,
          description: hackathons.description,
          tracks: hackathons.tracks,
          prizes: hackathons.prizes,
          prizePool: hackathons.prizePool,
          startDate: hackathons.startDate,
          endDate: hackathons.endDate,
          tags: hackathons.tags,
          techStack: hackathons.techStack,
          organizer: hackathons.organizer,
          website: hackathons.website,
        })
        .from(hackathons)
        .where(eq(hackathons.id, team.hackathonId))
        .limit(1);
      if (h) hackathonData = h;
    }

    // Fallback: if hackathonId is null but hackathonName exists, look up static data
    if (!hackathonData && team?.hackathonName) {
      const staticMatch = staticHackathons.find((sh) => sh.name === team.hackathonName);
      if (staticMatch) {
        hackathonData = {
          name: staticMatch.name,
          description: staticMatch.summary,
          tracks: staticMatch.tracks,
          prizes: null,
          prizePool: staticMatch.prizePool,
          startDate: staticMatch.dateRange,
          endDate: staticMatch.dateRange,
          tags: null,
          techStack: null,
          organizer: staticMatch.hostOrganizer || null,
          website: staticMatch.website,
        };
      }
    }

    // 5c. Inject hackathon context into messages for the AI
    const activeSkill = skillName || agentSession.activeSkill;
    const HACKATHON_SKILLS = ['hackathon-analysis', 'brainstorm', 'pitch-prep'];

    if (activeSkill && HACKATHON_SKILLS.includes(activeSkill)) {
      if (hackathonData) {
        const h = hackathonData;
        const tracks = Array.isArray(h.tracks) && h.tracks.length > 0
          ? `\n赛道: ${JSON.stringify(h.tracks)}`
          : '';
        const prizes = Array.isArray(h.prizes) && h.prizes.length > 0
          ? `\n奖项: ${JSON.stringify(h.prizes)}`
          : '';
        const hackathonContext = `[系统提示] 当前关联的黑客松赛事信息:
比赛名称: ${h.name}
${h.description ? `比赛描述: ${h.description}` : ''}
日期: ${h.startDate} ~ ${h.endDate}
${h.organizer ? `主办方: ${h.organizer}` : ''}
${h.prizePool ? `奖金池: ${h.prizePool}` : ''}${tracks}${prizes}
${h.website ? `官网: ${h.website}` : ''}
请基于以上赛事信息来回答用户的问题。`;
        contextMessages.unshift({ role: 'system', content: hackathonContext });
      } else {
        contextMessages.unshift({
          role: 'system',
          content: `[系统提示] 当前团队还没有关联任何黑客松赛事。用户正在使用 /${activeSkill} 功能，但没有赛题数据可供分析。请告知用户："你的团队还没有关联比赛，请先在团队设置中选择一个黑客松赛事，我才能帮你分析赛题哦！"不要编造任何比赛信息。`,
        });
      }
    }

    // 6. Call OpenClaw/Anthropic streaming API
    let sourceStream: ReadableStream<Uint8Array>;
    try {
      sourceStream = await streamChat({
        sessionId,
        messages: contextMessages,
        skill: activeSkill,
        apiKeys: {
          anthropic: team?.anthropicApiKey || undefined,
          openclaw: team?.openclawApiKey || undefined,
          provider: team?.llmProvider || undefined,
          providerKey: team?.llmApiKey || undefined,
          providerBaseUrl: team?.llmBaseUrl || undefined,
        },
        context: {
          teamId: agentSession.teamId,
          hackathonId: team?.hackathonId || undefined,
          hackathon: hackathonData,
          teamMembers: teamMembersData.map((m) => ({
            name: m.name || 'Unknown',
            skills: [],
            role: m.role || 'member',
          })),
        },
      });
    } catch (streamErr) {
      console.error('streamChat failed:', streamErr);
      // Return a graceful SSE error instead of 500 JSON
      const errEncoder = new TextEncoder();
      const errStream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(
            errEncoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: 'AI 服务暂时不可用，请稍后重试。' })}\n\n`
            )
          );
          ctrl.enqueue(
            errEncoder.encode(
              `event: done\ndata: ${JSON.stringify({ messageId: userMessage.id, userMessageId: userMessage.id, tokenCount: 0 })}\n\n`
            )
          );
          ctrl.close();
        },
      });
      return new Response(errStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 7. Wrap stream to accumulate response and save to DB on completion
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let tokenCount = 0;
    let currentEvent = '';
    const toolCallsData: Array<{
      id: string;
      name: string;
      input: unknown;
      status: string;
      result?: unknown;
      error?: string;
    }> = [];

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = sourceStream.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Pass through to client
            controller.enqueue(value);

            // Also parse to accumulate full response + tool call data
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
              }
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (currentEvent === 'token' && data.content) {
                    fullResponse += data.content;
                  }
                  if (currentEvent === 'done' || currentEvent === 'meta') {
                    if (data.tokenCount) tokenCount = data.tokenCount;
                    // Merge tool calls from done event if present
                    if (data.toolCalls && toolCallsData.length === 0) {
                      toolCallsData.push(...data.toolCalls);
                    }
                  }
                  if (currentEvent === 'tool_call') {
                    toolCallsData.push({
                      id: data.id,
                      name: data.name,
                      input: data.input,
                      status: 'running',
                    });
                  }
                  if (currentEvent === 'tool_result') {
                    const existing = toolCallsData.find((t) => t.id === data.id);
                    if (existing) {
                      existing.status = data.status;
                      existing.result = data.summary;
                      if (data.status === 'error') existing.error = data.summary;
                    }
                  }
                } catch {
                  // Skip unparseable
                }
              }
            }
          }

          // 8. Save assistant message to DB (with tool calls if any)
          const [savedMessage] = await db
            .insert(agentMessages)
            .values({
              sessionId,
              role: 'assistant',
              content: fullResponse || '(empty response)',
              skillName: activeSkill || null,
              tokenCount: tokenCount || null,
              toolCalls: toolCallsData.length > 0 ? toolCallsData : null,
            })
            .returning();

          // 9. Detect and save artifacts from the response
          const artifactIds: string[] = [];
          const artifactRegex = /:::artifact\{type="([^"]+)"\s+title="([^"]+)"\}\n([\s\S]*?):::/g;
          let match;
          while ((match = artifactRegex.exec(fullResponse)) !== null) {
            const [, type, title, content] = match;
            try {
              const [saved] = await db
                .insert(agentArtifacts)
                .values({
                  sessionId,
                  teamId: agentSession.teamId,
                  type: type as 'analysis_report' | 'idea_card' | 'feasibility_matrix' | 'task_board' | 'timeline' | 'resource_report' | 'pitch_outline' | 'demo_script' | 'project_description' | 'checklist' | 'custom',
                  title,
                  content: content.trim(),
                })
                .returning();

              artifactIds.push(saved.id);

              // Emit artifact event to client
              const artifactEvent = `event: artifact\ndata: ${JSON.stringify({
                id: saved.id,
                type,
                title,
                content: content.trim(),
                version: 1,
              })}\n\n`;
              controller.enqueue(encoder.encode(artifactEvent));
            } catch (artifactErr) {
              console.error('Failed to save artifact:', artifactErr);
            }
          }

          // Send final metadata event
          const metaEvent = `event: meta\ndata: ${JSON.stringify({
            messageId: savedMessage.id,
            userMessageId: userMessage.id,
            tokenCount,
            artifactIds,
          })}\n\n`;
          controller.enqueue(encoder.encode(metaEvent));

          controller.close();
        } catch (err) {
          console.error('Stream processing error:', err);
          const errMsg = err instanceof Error ? err.message : 'Stream error';
          const errEvent = `event: error\ndata: ${JSON.stringify({ message: errMsg })}\n\n`;
          controller.enqueue(encoder.encode(errEvent));

          // Still try to save what we have
          if (fullResponse) {
            await db.insert(agentMessages).values({
              sessionId,
              role: 'assistant',
              content: fullResponse,
              skillName: activeSkill || null,
              tokenCount: tokenCount || null,
            });
          }

          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
