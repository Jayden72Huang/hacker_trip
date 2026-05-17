import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getMessages, sendMessage, type MessageType } from '@/lib/messaging';
import {
  handleRouteError,
  isJsonRecord,
  isReasonableJson,
  jsonError,
  parseBoundedIntParam,
  parseOptionalDateParam,
  readJsonRecord,
  readString,
} from '@/lib/api/route-helpers';

const messageTypes = new Set<MessageType>([
  'text',
  'team_invite',
  'team_request',
  'agent_negotiation',
  'system',
]);

function parseMessageType(value: unknown): MessageType | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value === 'string' && messageTypes.has(value as MessageType)) {
    return value as MessageType;
  }

  return null;
}

async function verifyParticipant(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantA, userId),
          eq(conversations.participantB, userId),
        ),
      ),
    )
    .limit(1);
  return conv;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conv = await verifyParticipant(id, session.user.id);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const limit = parseBoundedIntParam(url.searchParams.get('limit'), {
      defaultValue: 50,
      min: 1,
      max: 100,
    });
    const before = parseOptionalDateParam(url.searchParams.get('before'));
    if (!before.ok) return before.response;

    const data = await getMessages(id, limit, before.value);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error, 'Get messages failed');
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conv = await verifyParticipant(id, session.user.id);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const body = await readJsonRecord(req);
    if (!body.ok) return body.response;

    const content = readString(body.data.content, 2000);
    if (!content) {
      return jsonError('Invalid message content', 400);
    }

    const type = parseMessageType(body.data.type);
    if (type === null) {
      return jsonError('Invalid message type', 400);
    }

    let metadata: Record<string, unknown> | undefined;
    if (body.data.metadata !== undefined) {
      if (!isJsonRecord(body.data.metadata) || !isReasonableJson(body.data.metadata)) {
        return jsonError('Invalid message metadata', 400);
      }
      metadata = body.data.metadata;
    }

    const result = await sendMessage({
      conversationId: id,
      senderId: session.user.id,
      content,
      type,
      metadata,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleRouteError(error, 'Send message failed');
  }
}
