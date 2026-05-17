import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentCards, a2aNegotiations, agentTeams, agentTeamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface NegotiationRound {
  round: number;
  from: string;
  to: string;
  proposal?: unknown;
  response?: unknown;
  timestamp: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { action?: string; counterProposal?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { action, counterProposal } = body;

  if (!action || !['accept', 'reject', 'counter'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (action === 'counter' && !counterProposal) {
    return NextResponse.json({ error: 'counterProposal is required for counter action' }, { status: 400 });
  }

  const [negotiation] = await db
    .select()
    .from(a2aNegotiations)
    .where(eq(a2aNegotiations.id, id))
    .limit(1);

  if (!negotiation) {
    return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
  }

  if (negotiation.expiresAt && new Date(negotiation.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Negotiation has expired' }, { status: 410 });
  }

  if (negotiation.status !== 'proposed' && negotiation.status !== 'counter_proposed') {
    return NextResponse.json({ error: 'Negotiation is no longer active' }, { status: 400 });
  }

  const [initiatorCard] = await db
    .select()
    .from(agentCards)
    .where(eq(agentCards.id, negotiation.initiatorAgentId))
    .limit(1);

  const [responderCard] = await db
    .select()
    .from(agentCards)
    .where(eq(agentCards.id, negotiation.responderAgentId))
    .limit(1);

  const isResponder = responderCard?.userId === session.user.id;
  const isInitiator = initiatorCard?.userId === session.user.id;

  if (!isResponder && !isInitiator) {
    return NextResponse.json({ error: 'Not authorized to respond' }, { status: 403 });
  }

  if (negotiation.status === 'proposed' && !isResponder) {
    return NextResponse.json({ error: 'Only the responder can respond to the initial proposal' }, { status: 403 });
  }

  if (negotiation.status === 'counter_proposed') {
    const lastRound = (negotiation.rounds as NegotiationRound[])?.at(-1);
    if (lastRound && lastRound.from === (isInitiator ? initiatorCard!.id : responderCard!.id)) {
      return NextResponse.json({ error: 'Waiting for the other party to respond' }, { status: 400 });
    }
  }

  const myCardId = isInitiator ? initiatorCard!.id : responderCard!.id;
  const otherCardId = isInitiator ? negotiation.responderAgentId : negotiation.initiatorAgentId;

  const existingRounds = (negotiation.rounds as NegotiationRound[]) || [];
  const newRound: NegotiationRound = {
    round: existingRounds.length + 1,
    from: myCardId,
    to: otherCardId,
    response: { action, counterProposal },
    timestamp: new Date().toISOString(),
  };

  let newStatus: 'accepted' | 'rejected' | 'counter_proposed';
  let resultTeamId: string | null = null;

  if (action === 'accept') {
    newStatus = 'accepted';
    const lastProposal = existingRounds[existingRounds.length - 1]?.proposal as Record<string, unknown> | undefined;

    if (initiatorCard && responderCard) {
      const [team] = await db.insert(agentTeams).values({
        name: (lastProposal?.teamName as string) || 'New Team',
        hackathonId: negotiation.hackathonId,
        createdBy: initiatorCard.userId,
      }).returning();

      await db.insert(agentTeamMembers).values([
        { teamId: team.id, userId: initiatorCard.userId, role: 'leader' },
        { teamId: team.id, userId: responderCard.userId, role: 'member' },
      ]);

      resultTeamId = team.id;
    }
  } else if (action === 'reject') {
    newStatus = 'rejected';
  } else {
    newStatus = 'counter_proposed';
    newRound.proposal = counterProposal;
  }

  const [updated] = await db
    .update(a2aNegotiations)
    .set({
      status: newStatus,
      rounds: [...existingRounds, newRound],
      finalProposal: action === 'accept' ? existingRounds.at(-1)?.proposal : undefined,
      resultTeamId,
      updatedAt: new Date(),
    })
    .where(eq(a2aNegotiations.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}
