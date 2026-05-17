import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

// GET /v1/recommendations — 当前用户的黑客松推荐
app.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const db = createDb(c.env.DATABASE_URL);

  const data = await db
    .select({
      id: schema.recommendations.id,
      hackathonId: schema.recommendations.hackathonId,
      score: schema.recommendations.score,
      reasons: schema.recommendations.reasons,
      matchedSkills: schema.recommendations.matchedSkills,
      matchedInterests: schema.recommendations.matchedInterests,
      isViewed: schema.recommendations.isViewed,
      isClicked: schema.recommendations.isClicked,
      feedback: schema.recommendations.feedback,
      createdAt: schema.recommendations.createdAt,
      hackathonName: schema.hackathons.name,
      hackathonSlug: schema.hackathons.slug,
      hackathonStatus: schema.hackathons.status,
      hackathonStartDate: schema.hackathons.startDate,
      hackathonEndDate: schema.hackathons.endDate,
      hackathonLocation: schema.hackathons.location,
      hackathonPrizePool: schema.hackathons.prizePool,
    })
    .from(schema.recommendations)
    .innerJoin(schema.hackathons, eq(schema.recommendations.hackathonId, schema.hackathons.id))
    .where(eq(schema.recommendations.userId, userId))
    .orderBy(desc(schema.recommendations.score))
    .limit(50);

  return c.json({ data });
});

export default app;
