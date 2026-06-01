import { NextRequest, NextResponse } from 'next/server';
import {
  buildPlatformSupportPrompt,
} from '@/data/platform-assistant';
import { db } from '@/lib/db';
import { hackathons as hackathonsTable } from '@/lib/db/schema';
import { toHomepageHackathon } from '@/lib/types/hackathon';
import { desc, eq } from 'drizzle-orm';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

type IncomingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  message?: string;
  messages?: IncomingMessage[];
};

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function errorResponse(
  status: number,
  error: string,
  code: string,
  hint: string,
  retryable = false
) {
  return NextResponse.json(
    { error, code, hint, retryable },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return errorResponse(
        500,
        'DeepSeek API 未配置。',
        'missing_api_key',
        '请在 .env.local 或 .dev.vars 中设置 DEEPSEEK_API_KEY。'
      );
    }

    const body = (await request.json()) as ChatRequest;
    const latestMessage = body.message?.trim();
    const history = Array.isArray(body.messages) ? body.messages : [];

    if (!latestMessage) {
      return errorResponse(
        400,
        '请提供消息内容。',
        'missing_message',
        '输入一个关于平台、黑客松或项目推广的问题后再发送。'
      );
    }

    const recentHistory = history
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const dbRows = await db
      .select()
      .from(hackathonsTable)
      .where(eq(hackathonsTable.isPublished, true))
      .orderBy(desc(hackathonsTable.startDate))
      .limit(80);

    const allHackathons = dbRows.map(toHomepageHackathon);

    // 以服务端当前时间为锚点，结构化拆分"可报名"与"已结束"，不让模型自行从文本里判断时间
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);

    const formatFullDate = (iso: string): string => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toISOString().slice(0, 10);
    };

    const renderHackathon = (h: (typeof allHackathons)[number]): string => {
      const tracks = h.tracks.map((t) => t.title).join(' / ');
      const registration =
        h.registration?.mode === 'platform'
          ? 'HackerTrip 站内报名'
          : h.registration?.mode === 'external-form'
            ? '主办方外部表单'
            : h.registration?.siteName || '主办方官网';
      const dateLine = `${formatFullDate(h.startDate)} ~ ${formatFullDate(h.endDate)}`;
      return [
        `- ${h.name}`,
        `  城市: ${h.city || '未标注'}`,
        `  日期: ${dateLine}（${h.isPast ? '已结束' : '未结束'}）`,
        `  形式: ${h.format}`,
        `  主题: ${h.theme}`,
        `  奖金池: ${h.prizePool}`,
        `  报名: ${registration}`,
        tracks ? `  赛道: ${tracks}` : '',
        h.hostOrganizer ? `  主办方: ${h.hostOrganizer}` : '',
      ].filter(Boolean).join('\n');
    };

    const upcoming = allHackathons.filter((h) => !h.isPast);
    const past = allHackathons.filter((h) => h.isPast);
    const cities = [...new Set(upcoming.map((h) => h.city).filter(Boolean))];

    const upcomingDigest = upcoming.length
      ? upcoming.map(renderHackathon).join('\n')
      : '（当前没有未结束的黑客松。）';

    // 已结束活动只保留最近的少量，作为"历史参考"，并明确禁止当作可报名活动推荐
    const pastDigest = past.length
      ? past.slice(0, 15).map(renderHackathon).join('\n')
      : '（暂无已结束活动记录。）';

    const systemPrompt = `${buildPlatformSupportPrompt()}

【重要时间基准】今天是 ${todayISO}。推荐任何活动前，必须先核对它的结束日期：结束日期早于今天的活动已经结束，绝对不能作为"可以参加 / 适合报名"的推荐，除非用户明确要求了解历史活动。如果用户问的城市或方向下没有未结束的活动，就如实说明当前没有可报名的活动，并可以建议关注即将公布的场次，而不是推荐一个已经结束的活动。

以下是可参考的平台知识摘要（实时从数据库获取）。仅使用这些公开信息回答，不要引用内部实现，不要编造不存在的功能或活动。

平台概览: 当前共 ${upcoming.length} 场未结束（可报名/进行中）黑客松，覆盖 ${cities.length} 个城市；另有若干已结束活动仅供历史参考。

## 可报名 / 进行中的黑客松（推荐只能从这里选）
${upcomingDigest}

## 已结束的黑客松（仅历史参考，禁止当作可报名活动推荐）
${pastDigest}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const upstream = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.5,
        max_tokens: 700,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: latestMessage },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => null);

      if (upstream.status === 401 || upstream.status === 403) {
        return errorResponse(upstream.status, 'DeepSeek 鉴权失败。', 'auth_failed', '请检查 API Key 是否正确、是否仍然有效。');
      }
      if (upstream.status === 429) {
        return errorResponse(429, 'DeepSeek 请求过于频繁或额度不足。', 'rate_limited', '请稍后重试，或检查账号额度与速率限制。', true);
      }
      if (upstream.status >= 500) {
        return errorResponse(upstream.status, 'DeepSeek 服务暂时不可用。', 'upstream_unavailable', '这是上游服务问题，可以稍后重试。', true);
      }
      return errorResponse(upstream.status, data?.error?.message || 'DeepSeek 请求失败。', 'request_failed', '请检查模型名、请求参数或稍后重试。', upstream.status >= 500);
    }

    if (!upstream.body) {
      return errorResponse(502, 'DeepSeek 未返回有效内容。', 'empty_response', '可以重试一次，或把问题表达得更具体一些。', true);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(ctrl) {
        ctrl.enqueue(encoder.encode(sseEvent('status', { phase: 'thinking' })));

        const reader = upstream.body!.getReader();
        let buffer = '';
        let firstToken = true;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const payload = trimmed.slice(6);
              if (payload === '[DONE]') continue;

              try {
                const chunk = JSON.parse(payload);
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                  if (firstToken) {
                    ctrl.enqueue(encoder.encode(sseEvent('status', { phase: 'streaming' })));
                    firstToken = false;
                  }
                  ctrl.enqueue(encoder.encode(sseEvent('token', { text: delta })));
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          ctrl.enqueue(encoder.encode(sseEvent('done', {})));
        } catch (err) {
          ctrl.enqueue(encoder.encode(sseEvent('error', {
            code: 'stream_error',
            message: '流式传输中断。',
            hint: '请重试。',
            retryable: true,
          })));
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return errorResponse(504, 'DeepSeek 响应超时。', 'timeout', '网络或上游响应较慢，请稍后重试。', true);
    }

    console.error('Haki chat error:', error);
    return errorResponse(500, '服务器错误。', 'server_error', '请稍后重试；如果持续失败，需要检查服务端日志。', true);
  }
}
