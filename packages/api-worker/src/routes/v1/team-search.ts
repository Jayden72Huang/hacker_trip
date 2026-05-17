import { Hono } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

function parseList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLimit(value?: string): number {
  const parsed = parseInt(value || '20', 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

// GET /v1/team-search — 搜索正在找队友的用户
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const {
    skills: skillsParam,
    interests: interestsParam,
    experienceLevel,
    limit: limitStr,
  } = c.req.query();

  const limit = parseLimit(limitStr);
  const skills = parseList(skillsParam);
  const interests = parseList(interestsParam);
  const conditions = [eq(schema.users.lookingForTeam, true)];

  for (const skill of skills) {
    conditions.push(sql`${schema.users.skills}::text ILIKE ${`%${skill}%`}`);
  }

  for (const interest of interests) {
    conditions.push(
      sql`(${schema.users.interests}::text ILIKE ${`%${interest}%`} OR ${schema.users.preferredTracks}::text ILIKE ${`%${interest}%`})`
    );
  }

  if (experienceLevel) {
    conditions.push(eq(schema.users.experienceLevel, experienceLevel));
  }

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        image: schema.users.image,
        bio: schema.users.bio,
        skills: schema.users.skills,
        interests: schema.users.interests,
        experienceLevel: schema.users.experienceLevel,
        lookingForTeam: schema.users.lookingForTeam,
        github: schema.users.github,
        linkedin: schema.users.linkedin,
      })
      .from(schema.users)
      .where(where)
      .limit(limit),
    db.select({ count: sql<number>`count(*)` }).from(schema.users).where(where),
  ]);

  return c.json({
    data,
    meta: { total: Number(countResult[0]?.count || 0), limit, offset: 0 },
  });
});

export default app;
