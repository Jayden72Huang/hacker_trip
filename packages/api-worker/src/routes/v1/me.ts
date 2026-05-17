import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

// GET /v1/me — 当前 API key 所属用户画像
app.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const db = createDb(c.env.DATABASE_URL);

  const [profile] = await db
    .select({
      name: schema.users.name,
      username: schema.users.username,
      skills: schema.users.skills,
      interests: schema.users.interests,
      lookingForTeam: schema.users.lookingForTeam,
      experienceLevel: schema.users.experienceLevel,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!profile) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'User profile not found', status: 404 } },
      404
    );
  }

  return c.json({ data: profile });
});

export default app;
