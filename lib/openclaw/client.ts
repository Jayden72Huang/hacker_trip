/**
 * OpenClaw Gateway client with Anthropic API (tool-calling) support.
 *
 * Strategy:
 * - When tools are available + ANTHROPIC_API_KEY set → Anthropic API with tool loop
 * - Fallback → OpenClaw Gateway (no tools, text-only)
 */

import { TOOL_DEFINITIONS } from '@/lib/tools/definitions';
import { executeToolCall } from '@/lib/tools/executor';
import type { ToolContext, ToolCallRecord } from '@/lib/tools/types';
import { LLM_PROVIDERS } from './providers';

const GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

const MAX_TOOL_ROUNDS = 5;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface HackathonData {
  name: string;
  description: string | null;
  tracks: unknown;
  prizes: unknown;
  prizePool: string | null;
  startDate: string | Date;
  endDate: string | Date;
  tags: unknown;
  techStack: unknown;
  organizer: string | null;
  website: string | null;
}

export interface OpenClawRequest {
  sessionId: string;
  messages: ChatMessage[];
  skill?: string | null;
  apiKeys?: {
    anthropic?: string;
    openclaw?: string;
    provider?: string;
    providerKey?: string;
    providerBaseUrl?: string;
  };
  context?: {
    teamId: string;
    hackathonId?: string;
    hackathon?: HackathonData | null;
    teamMembers?: Array<{ name: string; skills: string[]; role: string }>;
  };
}

const SOUL_PROMPT = `You are Hacker_Bot, a seasoned hackathon veteran who has mentored hundreds of teams. You combine deep technical knowledge with practical hackathon wisdom. You are the team's 24/7 digital teammate.

Communication Style:
- Direct and actionable: Every response should move the team forward
- Bilingual fluency: Default Chinese, switch to English for technical terms, brand names, and code
- Encouraging but honest: Celebrate good ideas, candidly flag risks
- Structured output: Use headers, bullet points, tables for clarity
- Time-aware: Always consider remaining hackathon time in recommendations
- Concise: Respect the team's time - be thorough but never verbose

Behavioral Principles:
- Prioritize "working demo" over "perfect architecture"
- Suggest the simplest viable solution first
- Flag scope creep immediately with alternatives
- Think in terms of MVP: what can ship in the time remaining?
- Produce structured documents (analysis reports, task boards, pitch outlines)
- Use markdown with consistent formatting

Tools:
- You have access to tools (github_search, web_scrape, set_reminder). Use them proactively when the user's request would benefit from real data.
- When asked to find resources, search GitHub directly instead of just suggesting keywords.
- When given a hackathon URL, scrape it to get real data instead of asking the user to paste content.
- When the team discusses deadlines, proactively offer to set reminders.`;

const SKILL_PROMPTS: Record<string, string> = {
  'hackathon-analysis': `You are in Hackathon Analysis mode.
If hackathon data is provided below, analyze it and produce:
1. Track analysis with difficulty assessment
2. Judging criteria breakdown with weights
3. Time allocation recommendation (10% planning, 60% dev, 15% testing, 15% pitch)
4. Strategic recommendations based on team strengths

If NO hackathon data is provided, it means the team has not linked a hackathon yet. Tell the user: "你的团队还没有关联比赛，请先在设置中选择一个黑客松赛事，我才能帮你分析赛题。" Do NOT make up any hackathon information.

If the user provides a URL to a hackathon page, use the web_scrape tool to extract information.`,

  brainstorm: `You are in Brainstorm mode. Use a Socratic approach to help the team generate and evaluate project ideas.
If hackathon data is provided, base your brainstorming on the hackathon tracks, themes, and judging criteria.
If NO hackathon data is provided, tell the user to link a hackathon first for better brainstorming, but you can still help with general idea generation.
Ask questions about:
1. Problem space (pain points, target users)
2. Solution space (ideal approach, competitor analysis)
3. Differentiation (unique value, MVP scope)
4. Feasibility check (dependencies, data sources)
Generate 3-5 idea cards with feasibility scores.`,

  'project-planning': `You are in Project Planning mode. Help decompose the project into tasks and create a work plan:
1. Architecture decomposition (modules: frontend, backend, API, integrations)
2. Work breakdown structure (3 levels: modules → features → tasks)
3. Skill-based assignment (match tasks to team member strengths)
4. Timeline generation with dependencies and milestones
5. Risk analysis and checkpoint definitions

When setting milestones, proactively use the set_reminder tool to schedule check-in reminders.`,

  'resource-discovery': `You are in Resource Discovery mode. Help find relevant tools, frameworks, and open-source projects:
1. Use the github_search tool to find real repositories matching the team's needs
2. Recommend frameworks and libraries with actual star counts and activity
3. Suggest MCP servers and tools
4. Provide quick-start guides and setup instructions

Always search GitHub with the github_search tool rather than relying solely on your training data.`,

  'pitch-prep': `You are in Pitch Preparation mode. Help prepare presentation materials:
1. Pitch deck structure (8-12 slides with timing)
2. Demo script (timed walkthrough)
3. Project description (multiple formats for submission)
4. Q&A preparation (anticipated judge questions)
5. Rehearsal checklist`,
};

// ─── System prompt builder ───

function buildSystemPrompt(request: OpenClawRequest): string {
  let systemPrompt = SOUL_PROMPT;
  if (request.skill && SKILL_PROMPTS[request.skill]) {
    systemPrompt += `\n\n---\n\n${SKILL_PROMPTS[request.skill]}`;
  }
  if (request.context) {
    systemPrompt += `\n\n---\nContext:\n- Team ID: ${request.context.teamId}`;
    if (request.context.teamMembers?.length) {
      systemPrompt += `\n- Team Members: ${request.context.teamMembers.map((m) => `${m.name} (${m.role}, skills: ${m.skills.join(', ')})`).join('; ')}`;
    }
    if (request.context.hackathon) {
      const h = request.context.hackathon;
      systemPrompt += `\n\n## Hackathon Data\n`;
      systemPrompt += `- Name: ${h.name}\n`;
      if (h.description) systemPrompt += `- Description: ${h.description}\n`;
      systemPrompt += `- Dates: ${h.startDate} ~ ${h.endDate}\n`;
      if (h.organizer) systemPrompt += `- Organizer: ${h.organizer}\n`;
      if (h.prizePool) systemPrompt += `- Prize Pool: ${h.prizePool}\n`;
      if (h.website) systemPrompt += `- Website: ${h.website}\n`;
      if (h.tracks && Array.isArray(h.tracks) && h.tracks.length > 0) {
        systemPrompt += `- Tracks: ${JSON.stringify(h.tracks)}\n`;
      }
      if (h.prizes && Array.isArray(h.prizes) && h.prizes.length > 0) {
        systemPrompt += `- Prizes: ${JSON.stringify(h.prizes)}\n`;
      }
      if (h.tags && Array.isArray(h.tags) && h.tags.length > 0) {
        systemPrompt += `- Tags: ${(h.tags as string[]).join(', ')}\n`;
      }
      if (h.techStack && Array.isArray(h.techStack) && h.techStack.length > 0) {
        systemPrompt += `- Tech Stack: ${(h.techStack as string[]).join(', ')}\n`;
      }
    }
  }
  return systemPrompt;
}

// ─── SSE helpers ───

type SSEEmitter = (event: string, data: Record<string, unknown>) => void;

function createSSEEmitter(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): SSEEmitter {
  return (event: string, data: Record<string, unknown>) => {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };
}

// ─── Main entry point ───

/**
 * Stream a chat response.
 * Priority: OpenClaw Gateway → User's selected LLM provider → error.
 */
export async function streamChat(
  request: OpenClawRequest
): Promise<ReadableStream<Uint8Array>> {
  const openclawKey = request.apiKeys?.openclaw || OPENCLAW_API_KEY;

  // 1. Primary: OpenClaw Gateway
  if (openclawKey) {
    try {
      return await streamFromOpenClaw(request, openclawKey);
    } catch (err) {
      console.warn('OpenClaw Gateway failed, trying user provider fallback:', err);
    }
  }

  // 2. Fallback: User's selected LLM provider
  const providerId = request.apiKeys?.provider;
  const providerKey = request.apiKeys?.providerKey;

  if (providerId && providerKey) {
    const providerDef = LLM_PROVIDERS[providerId];
    if (providerDef) {
      const baseUrl = request.apiKeys?.providerBaseUrl || providerDef.baseUrl;
      const model = providerDef.defaultModel;

      try {
        let stream: ReadableStream<Uint8Array>;

        if (providerDef.format === 'anthropic') {
          stream = await streamFromAnthropicWithTools(request, providerKey);
        } else {
          stream = await streamFromOpenAICompat(request, providerKey, baseUrl, model);
        }

        return prependFallbackNotice(stream);
      } catch (err) {
        console.warn(`Provider ${providerId} failed:`, err);
      }
    }
  }

  // 3. Legacy fallback: env var Anthropic key (backward compat)
  const anthropicKey = request.apiKeys?.anthropic || ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const stream = await streamFromAnthropicWithTools(request, anthropicKey);
      return prependFallbackNotice(stream);
    } catch (err) {
      console.warn('Anthropic API legacy fallback also failed:', err);
    }
  }

  return createSSEStream([
    {
      event: 'error',
      data: { message: 'AI 服务暂时不可用，请在设置中配置 API Key。', code: 'NO_API_KEY' },
    },
  ]);
}

/**
 * Wrap a stream to prepend a "fallback active" notice as the first token event.
 */
function prependFallbackNotice(
  source: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const notice = `event: fallback\ndata: ${JSON.stringify({ active: true, message: 'AI大模型站岗ing' })}\n\n`;

  return new ReadableStream({
    async start(controller) {
      // Emit fallback notice first
      controller.enqueue(encoder.encode(notice));

      // Then pipe through the original stream
      const reader = source.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ─── Anthropic API with tool calling loop ───

interface AnthropicContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

async function streamFromAnthropicWithTools(
  request: OpenClawRequest,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const systemPrompt = buildSystemPrompt(request);

  // Build Anthropic-format messages (content blocks), filter out system messages
  const apiMessages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<Record<string, unknown>>;
  }> = request.messages
    .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } =>
      m.role === 'user' || m.role === 'assistant'
    )
    .map((m) => ({ role: m.role, content: m.content }));

  const toolContext: ToolContext = {
    teamId: request.context?.teamId || '',
    sessionId: request.sessionId,
  };

  return new ReadableStream({
    async start(controller) {
      const emit = createSSEEmitter(controller, encoder);
      const allToolCalls: ToolCallRecord[] = [];
      let totalTokens = 0;

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const { textContent, toolUseBlocks, stopReason, outputTokens } =
            await callAnthropicStreaming(
              systemPrompt,
              apiMessages,
              emit,
              apiKey
            );

          totalTokens += outputTokens;

          // No tool calls → we're done
          if (stopReason !== 'tool_use' || toolUseBlocks.length === 0) {
            break;
          }

          // Execute tool calls
          const toolResults: Array<Record<string, unknown>> = [];

          for (const toolUse of toolUseBlocks) {
            const toolId = toolUse.id!;
            const toolName = toolUse.name!;
            const toolInput = (toolUse.input || {}) as Record<string, unknown>;

            emit('tool_call', {
              id: toolId,
              name: toolName,
              input: toolInput,
              status: 'running',
            });

            const result = await executeToolCall(toolName, toolInput, toolContext);

            const record: ToolCallRecord = {
              id: toolId,
              name: toolName,
              input: toolInput,
              status: result.success ? 'success' : 'error',
              result: result.success ? result.content : undefined,
              error: result.error,
              executionTimeMs: (result.metadata?.executionTimeMs as number) || 0,
            };
            allToolCalls.push(record);

            emit('tool_result', {
              id: toolId,
              name: toolName,
              status: result.success ? 'success' : 'error',
              summary: result.success
                ? result.content.slice(0, 150)
                : result.error || 'Unknown error',
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolId,
              content: result.success
                ? result.content
                : `Error: ${result.error}`,
            });
          }

          // Append assistant response + tool results for next round
          const assistantContent: Array<Record<string, unknown>> = [];
          if (textContent) {
            assistantContent.push({ type: 'text', text: textContent });
          }
          for (const tu of toolUseBlocks) {
            assistantContent.push({
              type: 'tool_use',
              id: tu.id,
              name: tu.name,
              input: tu.input,
            });
          }

          apiMessages.push({ role: 'assistant', content: assistantContent });
          apiMessages.push({ role: 'user', content: toolResults });
        }

        // Done event with tool call metadata
        emit('done', {
          tokenCount: totalTokens,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        });
        controller.close();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        emit('error', { message: errMsg });
        controller.close();
      }
    },
  });
}

/**
 * Call Anthropic API with streaming. Parses the stream and:
 * - Emits `token` SSE events for text deltas in real-time
 * - Accumulates text content and tool_use blocks
 * - Returns the complete results when the stream ends
 */
async function callAnthropicStreaming(
  systemPrompt: string,
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<Record<string, unknown>>;
  }>,
  emit: SSEEmitter,
  apiKey: string
): Promise<{
  textContent: string;
  toolUseBlocks: AnthropicContentBlock[];
  stopReason: string;
  outputTokens: number;
}> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  let textContent = '';
  let outputTokens = 0;
  let stopReason = 'end_turn';

  // Track content blocks by index
  const contentBlocks: Map<number, AnthropicContentBlock> = new Map();
  let currentBlockIndex = -1;
  // Accumulate partial JSON for tool input
  const toolInputBuffers: Map<number, string> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const event = JSON.parse(jsonStr);

        switch (event.type) {
          case 'content_block_start': {
            currentBlockIndex = event.index ?? currentBlockIndex + 1;
            const block = event.content_block;
            if (block?.type === 'text') {
              contentBlocks.set(currentBlockIndex, {
                type: 'text',
                text: block.text || '',
              });
            } else if (block?.type === 'tool_use') {
              contentBlocks.set(currentBlockIndex, {
                type: 'tool_use',
                id: block.id,
                name: block.name,
                input: {},
              });
              toolInputBuffers.set(currentBlockIndex, '');
            }
            break;
          }

          case 'content_block_delta': {
            const idx = event.index ?? currentBlockIndex;
            const existing = contentBlocks.get(idx);

            if (event.delta?.type === 'text_delta' && event.delta.text) {
              // Stream text to client immediately
              emit('token', { content: event.delta.text });
              if (existing?.type === 'text') {
                existing.text = (existing.text || '') + event.delta.text;
              }
              textContent += event.delta.text;
            }

            if (
              event.delta?.type === 'input_json_delta' &&
              event.delta.partial_json !== undefined
            ) {
              // Accumulate tool input JSON
              const buf = toolInputBuffers.get(idx) || '';
              toolInputBuffers.set(idx, buf + event.delta.partial_json);
            }
            break;
          }

          case 'content_block_stop': {
            const stopIdx = event.index ?? currentBlockIndex;
            const block = contentBlocks.get(stopIdx);
            if (block?.type === 'tool_use') {
              // Parse accumulated JSON input
              const jsonBuf = toolInputBuffers.get(stopIdx) || '{}';
              try {
                block.input = JSON.parse(jsonBuf);
              } catch {
                block.input = {};
              }
            }
            break;
          }

          case 'message_delta': {
            if (event.delta?.stop_reason) {
              stopReason = event.delta.stop_reason;
            }
            if (event.usage?.output_tokens) {
              outputTokens = event.usage.output_tokens;
            }
            break;
          }

          case 'message_start': {
            if (event.message?.usage?.output_tokens) {
              outputTokens = event.message.usage.output_tokens;
            }
            break;
          }
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  const toolUseBlocks = Array.from(contentBlocks.values()).filter(
    (b) => b.type === 'tool_use'
  );

  return { textContent, toolUseBlocks, stopReason, outputTokens };
}

// ─── OpenAI-compatible provider (GPT, Gemini, DeepSeek, Mistral, etc.) ───

async function streamFromOpenAICompat(
  request: OpenClawRequest,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = buildSystemPrompt(request);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...request.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 50000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 8192,
        stream: true,
      }),
      signal: abortCtrl.signal,
    });

    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      const errBody = await response.text().catch(() => '');
      let errMsg = `Provider error: ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) errMsg = parsed.error.message;
      } catch {}
      throw new Error(errMsg);
    }

    // Reuse the OpenAI-format stream transformer
    return transformOpenClawStream(response.body);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─── OpenClaw Gateway (text-only fallback) ───

async function streamFromOpenClaw(
  request: OpenClawRequest,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 50000);

  try {
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sessionId: request.sessionId,
        messages: request.messages,
        skill: request.skill,
        context: request.context,
        stream: true,
      }),
      signal: abortCtrl.signal,
    });

    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      // Try to extract error message from JSON body
      const errBody = await response.text().catch(() => '');
      let errMsg = `OpenClaw error: ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) errMsg = parsed.error.message;
      } catch {}
      throw new Error(errMsg);
    }

    // Peek at the first chunk to detect empty/error responses
    // (OpenClaw returns 200 + "data: [DONE]" when all models are rate-limited)
    const reader = response.body.getReader();
    const { done, value } = await reader.read();

    if (done || !value) {
      throw new Error('OpenClaw returned empty stream');
    }

    const firstChunk = new TextDecoder().decode(value);
    if (firstChunk.trim() === 'data: [DONE]') {
      throw new Error('OpenClaw returned no content (models may be rate-limited)');
    }

    // Reconstruct stream: replay first chunk + pipe remaining
    const replayStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(value);
        try {
          while (true) {
            const { done: d, value: v } = await reader.read();
            if (d) break;
            controller.enqueue(v);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return transformOpenClawStream(replayStream);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function transformOpenClawStream(
  source: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalTokens = 0;

  return new ReadableStream({
    async start(controller) {
      const reader = source.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const event = JSON.parse(jsonStr);
              const content = event.choices?.[0]?.delta?.content;
              if (content) {
                const sseData = `event: token\ndata: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
              if (event.usage?.total_tokens) {
                totalTokens = event.usage.total_tokens;
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        const doneData = `event: done\ndata: ${JSON.stringify({ tokenCount: totalTokens })}\n\n`;
        controller.enqueue(encoder.encode(doneData));
        controller.close();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        const errData = `event: error\ndata: ${JSON.stringify({ message: errMsg })}\n\n`;
        controller.enqueue(encoder.encode(errData));
        controller.close();
      }
    },
  });
}

// ─── Utilities ───

function createSSEStream(
  events: Array<{ event: string; data: Record<string, unknown> }>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(
          encoder.encode(
            `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`
          )
        );
      }
      controller.close();
    },
  });
}
