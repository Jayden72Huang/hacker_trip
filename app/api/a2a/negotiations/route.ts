import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentCards, a2aNegotiations, hackathons, users } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [card] = await db
    .select({ id: agentCards.id })
    .from(agentCards)
    .where(eq(agentCards.userId, session.user.id))
    .limit(1);

  if (!card) {
    return NextResponse.json({ data: [] });
  }

  const data = await db
    .select()
    .from(a2aNegotiations)
    .where(
      or(
        eq(a2aNegotiations.initiatorAgentId, card.id),
        eq(a2aNegotiations.responderAgentId, card.id),
      ),
    )
    .orderBy(desc(a2aNegotiations.createdAt));

  return NextResponse.json({ data });
}
