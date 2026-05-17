import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentCards, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const skillsParam = url.searchParams.get('skills');
  const lookingForTeam = url.searchParams.get('lookingForTeam');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  const conditions = [
    eq(agentCards.isPublic, true),
    eq(agentCards.allowAgentContact, true),
  ];

  if (skillsParam) {
    const skills = skillsParam.split(',').map((s) => s.trim());
    for (const skill of skills) {
      conditions.push(sql`${agentCards.skills}::text ILIKE ${'%' + skill + '%'}`);
    }
  }

  if (lookingForTeam === 'true') {
    conditions.push(eq(users.lookingForTeam, true));
  }

  const data = await db
    .select({
      id: agentCards.id,
      name: agentCards.name,
      description: agentCards.description,
      capabilities: agentCards.capabilities,
      skills: agentCards.skills,
      interests: agentCards.interests,
      preferredTracks: agentCards.preferredTracks,
      autoNegotiate: agentCards.autoNegotiate,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        experienceLevel: users.experienceLevel,
      },
    })
    .from(agentCards)
    .innerJoin(users, eq(users.id, agentCards.userId))
    .where(and(...conditions))
    .limit(limit);

  return NextResponse.json({ data });
}
