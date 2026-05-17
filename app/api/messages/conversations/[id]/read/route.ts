import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { markConversationRead } from '@/lib/messaging';
import { handleRouteError } from '@/lib/api/route-helpers';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [conv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          or(
            eq(conversations.participantA, session.user.id),
            eq(conversations.participantB, session.user.id),
          ),
        ),
      )
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await markConversationRead(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Mark conversation read failed');
  }
}
