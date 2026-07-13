import { after, NextRequest, NextResponse } from 'next/server';
import { handleAgentMessage, normalizeIncomingText } from '@/lib/feishu-agent/agent';
import { FeishuAgentClient } from '@/lib/feishu-agent/client';
import { getFeishuAgentConfig, getMissingFeishuAgentConfig } from '@/lib/feishu-agent/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface UrlVerificationBody {
  type?: string;
  token?: string;
  challenge?: string;
}

interface EventHeader {
  event_id?: string;
  event_type?: string;
  app_id?: string;
  token?: string;
}

interface MessageMention {
  key?: string;
}

interface MessageEventBody {
  schema?: string;
  header?: EventHeader;
  event?: {
    sender?: {
      sender_id?: { open_id?: string };
    };
    message?: {
      message_id?: string;
      chat_id?: string;
      chat_type?: string;
      message_type?: string;
      content?: string;
      mentions?: MessageMention[];
    };
  };
}

function forbidden(message: string) {
  return NextResponse.json({ code: 403, msg: message }, { status: 403 });
}

function parseTextContent(content: string): string {
  try {
    const parsed = JSON.parse(content) as { text?: string };
    return parsed.text || '';
  } catch {
    return '';
  }
}

export async function GET() {
  const config = getFeishuAgentConfig();
  const missing = getMissingFeishuAgentConfig(config);
  return NextResponse.json({
    ok: missing.length === 0,
    service: 'HackerTrip Feishu Agent',
    configured: missing.length === 0,
    missing,
    targetChatConfigured: Boolean(config.chatId),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as UrlVerificationBody & MessageEventBody;
  const config = getFeishuAgentConfig();

  if (body.type === 'url_verification') {
    if (config.verificationToken && body.token !== config.verificationToken) return forbidden('invalid verification token');
    return NextResponse.json({ challenge: body.challenge || '' });
  }

  if (config.verificationToken && body.header?.token !== config.verificationToken) return forbidden('invalid event token');
  if (config.appId && body.header?.app_id !== config.appId) return forbidden('invalid app id');
  if (body.header?.event_type !== 'im.message.receive_v1') return NextResponse.json({ code: 0 });

  const message = body.event?.message;
  if (!message?.message_id || !message.chat_id || message.message_type !== 'text') return NextResponse.json({ code: 0 });
  if (message.chat_id !== config.chatId) return NextResponse.json({ code: 0 });

  const mentionKeys = (message.mentions || []).map(mention => mention.key || '').filter(Boolean);
  const text = normalizeIncomingText(parseTextContent(message.content || ''), mentionKeys);
  if (!text) return NextResponse.json({ code: 0 });

  after(async () => {
    const client = new FeishuAgentClient(config);
    try {
      const missing = getMissingFeishuAgentConfig(config);
      if (missing.length) throw new Error(`服务端缺少配置：${missing.join('、')}`);
      const answer = await handleAgentMessage(config, text);
      await client.reply(message.message_id!, answer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '未知错误';
      console.error('[feishu-agent]', body.header?.event_id, reason);
      try {
        await client.reply(message.message_id!, `⚠️ 操作未完成：${reason}`);
      } catch (replyError) {
        console.error('[feishu-agent-reply]', replyError);
      }
    }
  });

  return NextResponse.json({ code: 0 });
}
