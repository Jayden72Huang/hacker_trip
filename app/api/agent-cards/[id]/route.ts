import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentCards, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [card] = await db
    .select({
      id: agentCards.id,
      name: agentCards.name,
      description: agentCards.description,
      url: agentCards.url,
      version: agentCards.version,
      capabilities: agentCards.capabilities,
      skills: agentCards.skills,
      interests: agentCards.interests,
      preferredTracks: agentCards.preferredTracks,
      isPublic: agentCards.isPublic,
      allowAgentContact: agentCards.allowAgentContact,
      autoNegotiate: agentCards.autoNegotiate,
      createdAt: agentCards.createdAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(agentCards)
    .innerJoin(users, eq(users.id, agentCards.userId))
    .where(and(eq(agentCards.id, id), eq(agentCards.isPublic, true)))
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: 'Agent card not found' }, { status: 404 });
  }

  return NextResponse.json({ data: card });
}
