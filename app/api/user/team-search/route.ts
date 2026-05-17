import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, sql, ne, type SQL } from 'drizzle-orm';
import {
  handleRouteError,
  parseBoundedIntParam,
  parseCsvParam,
} from '@/lib/api/route-helpers';

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
  return [];
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.user.id;

    const url = new URL(req.url);
    const lookingForTeam = url.searchParams.get('lookingForTeam');
    const experienceLevel = url.searchParams.get('experienceLevel');
    const limit = parseBoundedIntParam(url.searchParams.get('limit'), {
      defaultValue: 20,
      min: 1,
      max: 50,
    });
    const offset = parseBoundedIntParam(url.searchParams.get('offset'), {
      defaultValue: 0,
      min: 0,
      max: 5000,
    });
    const searchSkills = parseCsvParam(url.searchParams.get('skills'));
    const searchInterests = parseCsvParam(url.searchParams.get('interests'));

    const conditions: SQL[] = [ne(users.id, currentUserId)];

    if (lookingForTeam === 'true') {
      conditions.push(eq(users.lookingForTeam, true));
    }
    if (experienceLevel) {
      conditions.push(eq(users.experienceLevel, experienceLevel));
    }
    for (const skill of searchSkills) {
      conditions.push(sql`${users.skills}::text ILIKE ${'%' + skill + '%'}`);
    }
    for (const interest of searchInterests) {
      conditions.push(
        sql`(${users.interests}::text ILIKE ${'%' + interest + '%'} OR ${users.preferredTracks}::text ILIKE ${'%' + interest + '%'})`,
      );
    }

    const where = and(...conditions);

    const [candidates, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          bio: users.bio,
          skills: users.skills,
          interests: users.interests,
          experienceLevel: users.experienceLevel,
          lookingForTeam: users.lookingForTeam,
          github: users.github,
          linkedin: users.linkedin,
        })
        .from(users)
        .where(where)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(users).where(where),
    ]);

    const data = candidates
      .map((u) => {
        const userSkills = toStringArray(u.skills);
        const userInterests = toStringArray(u.interests);
        const skillMatch = searchSkills.length > 0
          ? jaccardSimilarity(searchSkills, userSkills)
          : 0;
        const interestMatch = searchInterests.length > 0
          ? jaccardSimilarity(searchInterests, userInterests)
          : 0;
        const matchScore = Math.round((skillMatch * 60 + interestMatch * 40));
        const matchedSkills = searchSkills.filter((s) =>
          userSkills.some((us) => us.toLowerCase() === s.toLowerCase()),
        );

        return {
          ...u,
          matchScore,
          matchedSkills,
          profileUrl: u.username ? `/u/${u.username}` : undefined,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      data,
      meta: { total: Number(countResult[0]?.count || 0), limit, offset },
    });
  } catch (error) {
    return handleRouteError(error, 'Team search failed');
  }
}
