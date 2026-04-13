import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

// GET /v1/stats — 平台统计
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);

  const [hackathonCount, verifiedWorkCount, userCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.hackathons),
    db.select({ count: sql<number>`count(*)` }).from(schema.projects).where(eq(schema.projects.verificationStatus, 'approved')),
    db.select({ count: sql<number>`count(*)` }).from(schema.users),
  ]);

  return c.json({
    data: {
      totalHackathons: Number(hackathonCount[0]?.count || 0),
      verifiedWorks: Number(verifiedWorkCount[0]?.count || 0),
      totalUsers: Number(userCount[0]?.count || 0),
    },
  });
});

export default app;
