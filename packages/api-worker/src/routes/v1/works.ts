import { Hono } from 'hono';
import { eq, desc, asc, ilike, and, sql } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

// GET /v1/works — 已验证作品列表/搜索
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { q, hackathon_id, has_awards, sort, limit: limitStr, offset: offsetStr } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10), 1), 50);
  const offset = Math.max(parseInt(offsetStr || '0', 10), 0);

  const conditions = [
    eq(schema.projects.verificationStatus, 'approved'),
    eq(schema.projects.isPublic, true),
  ];

  if (q) conditions.push(ilike(schema.projects.name, `%${q}%`));
  if (hackathon_id) conditions.push(eq(schema.projects.hackathonId, hackathon_id));

  const where = and(...conditions);
  const sortField = sort === 'name' ? schema.projects.name : schema.projects.createdAt;
  const sortDir = sort === 'name' ? asc(sortField) : desc(sortField);

  const [data, countResult] = await Promise.all([
    db.select().from(schema.projects).where(where).orderBy(sortDir).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.projects).where(where),
  ]);

  // Strip internal verification fields from response
  const sanitized = data.map(({ aiReviewResult, adminReviewerId, adminReviewNotes, ...rest }) => rest);

  return c.json({
    data: sanitized,
    meta: { total: Number(countResult[0]?.count || 0), limit, offset },
  });
});

// GET /v1/works/:id — 作品详情
app.get('/:id', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const id = c.req.param('id');

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, id),
      eq(schema.projects.verificationStatus, 'approved'),
      eq(schema.projects.isPublic, true),
    ))
    .limit(1);

  if (!project) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Work not found', status: 404 } },
      404
    );
  }

  // Get team members
  const teamMembers = await db
    .select()
    .from(schema.workTeamMembers)
    .where(eq(schema.workTeamMembers.projectId, id));

  const { aiReviewResult, adminReviewerId, adminReviewNotes, ...safe } = project;

  return c.json({
    data: { ...safe, teamMembers },
  });
});

export default app;
