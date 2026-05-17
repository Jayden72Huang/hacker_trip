import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentCards, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function booleanOrDefault(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [card] = await db
    .select()
    .from(agentCards)
    .where(eq(agentCards.userId, session.user.id))
    .limit(1);

  return NextResponse.json({ data: card || null });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await db
    .select({ id: agentCards.id })
    .from(agentCards)
    .where(eq(agentCards.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Agent card already exists, use PUT to update' }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const [user] = await db
    .select({ skills: users.skills, interests: users.interests, preferredTracks: users.preferredTracks })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const [card] = await db.insert(agentCards).values({
    userId: session.user.id,
    name: optionalString(body.name) || `${session.user.name || 'User'}'s Agent`,
    description: optionalString(body.description),
    capabilities: body.capabilities || ['team_search', 'negotiate_teamup'],
    skills: body.skills || user?.skills || [],
    interests: body.interests || user?.interests || [],
    preferredTracks: body.preferredTracks || user?.preferredTracks || [],
    isPublic: booleanOrDefault(body.isPublic, true),
    allowAgentContact: booleanOrDefault(body.allowAgentContact, true),
    autoNegotiate: booleanOrDefault(body.autoNegotiate, false),
    negotiationRules: body.negotiationRules || {},
  }).returning();

  await db.update(users).set({ agentModeEnabled: true }).where(eq(users.id, session.user.id));

  return NextResponse.json({ data: card }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowedFields = [
    'name', 'description', 'capabilities', 'skills', 'interests',
    'preferredTracks', 'isPublic', 'allowAgentContact', 'autoNegotiate',
    'negotiationRules', 'url', 'version',
  ] as const;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const [card] = await db
    .update(agentCards)
    .set(updates)
    .where(eq(agentCards.userId, session.user.id))
    .returning();

  if (!card) {
    return NextResponse.json({ error: 'Agent card not found' }, { status: 404 });
  }

  return NextResponse.json({ data: card });
}
