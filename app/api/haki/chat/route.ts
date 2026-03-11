import { NextRequest, NextResponse } from 'next/server';
import {
  buildPlatformKnowledgeDigest,
  buildPlatformSupportPrompt,
} from '@/data/platform-assistant';

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

    const systemPrompt = `${buildPlatformSupportPrompt()}

以下是可参考的平台知识摘要。仅使用这些公开信息回答，不要引用内部实现，不要编造不存在的功能或活动。

${buildPlatformKnowledgeDigest()}`;

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
