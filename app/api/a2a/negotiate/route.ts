import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentCards, a2aNegotiations, hackathons, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notifyNegotiation } from '@/lib/notifications';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { targetAgentId?: string; hackathonId?: string; proposal?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { targetAgentId, hackathonId, proposal } = body;

  if (!targetAgentId || !proposal) {
    return NextResponse.json({ error: 'Missing targetAgentId or proposal' }, { status: 400 });
  }

  const [initiatorCard] = await db
    .select()
    .from(agentCards)
    .where(eq(agentCards.userId, session.user.id))
    .limit(1);

  if (!initiatorCard) {
    return NextResponse.json({ error: 'You need an Agent Card first' }, { status: 400 });
  }

  const [targetCard] = await db
    .select()
    .from(agentCards)
    .where(eq(agentCards.id, targetAgentId))
    .limit(1);

  if (!targetCard || !targetCard.allowAgentContact) {
    return NextResponse.json({ error: 'Target agent not found or not accepting contacts' }, { status: 404 });
  }

  if (targetCard.userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot negotiate with your own agent' }, { status: 400 });
  }

  let hackathonName: string | null = null;
  if (hackathonId) {
    const [h] = await db
      .select({ name: hackathons.name })
      .from(hackathons)
      .where(eq(hackathons.id, hackathonId))
      .limit(1);
    hackathonName = h?.name || null;
  }

  const rounds = [{
    round: 1,
    from: initiatorCard.id,
    to: targetCard.id,
    proposal,
    timestamp: new Date().toISOString(),
  }];

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [negotiation] = await db.insert(a2aNegotiations).values({
    initiatorAgentId: initiatorCard.id,
    responderAgentId: targetCard.id,
    hackathonId: hackathonId || null,
    status: 'proposed',
    rounds,
    expiresAt,
  }).returning();

  const [initiator] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await notifyNegotiation(
    targetCard.userId,
    initiator?.name || 'Someone',
    hackathonName,
    negotiation.id,
  );

  return NextResponse.json({ data: negotiation }, { status: 201 });
}
