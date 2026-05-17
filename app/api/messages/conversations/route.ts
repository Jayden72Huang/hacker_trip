import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { findOrCreateConversation, getConversations } from '@/lib/messaging';
import { eq } from 'drizzle-orm';
import { handleRouteError, jsonError, readJsonRecord, readString } from '@/lib/api/route-helpers';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getConversations(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error, 'Get conversations failed');
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonRecord(req);
    if (!body.ok) return body.response;

    const recipientId = readString(body.data.recipientId, 128);
    if (!recipientId || recipientId === session.user.id) {
      return jsonError('Invalid recipient', 400);
    }

    const [recipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1);

    if (!recipient) {
      return jsonError('Recipient not found', 404);
    }

    const conversationId = await findOrCreateConversation(session.user.id, recipientId);
    return NextResponse.json({ data: { conversationId } });
  } catch (error) {
    return handleRouteError(error, 'Create conversation failed');
  }
}
