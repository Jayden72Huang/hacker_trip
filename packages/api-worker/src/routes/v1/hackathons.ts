import { Hono } from 'hono';
import { eq, desc, asc, ilike, and, sql } from 'drizzle-orm';
import type { Env } from '../../types/env';
import { createDb, schema } from '../../db/client';

const app = new Hono<{ Bindings: Env }>();

// GET /v1/hackathons — 列表/搜索
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { q, status, mode, featured, sort, order, limit: limitStr, offset: offsetStr } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10), 1), 100);
  const offset = Math.max(parseInt(offsetStr || '0', 10), 0);

  const conditions = [];
  if (q) conditions.push(ilike(schema.hackathons.name, `%${q}%`));
  if (status) conditions.push(eq(schema.hackathons.status, status as 'upcoming' | 'ongoing' | 'ended'));
  if (mode) conditions.push(eq(schema.hackathons.mode, mode as 'online' | 'offline' | 'hybrid'));
  if (featured === 'true') conditions.push(eq(schema.hackathons.isFeatured, true));

  const sortField = sort === 'created_at' ? schema.hackathons.createdAt
    : sort === 'participant_count' ? schema.hackathons.participantCount
    : schema.hackathons.startDate;
  const sortDir = order === 'asc' ? asc(sortField) : desc(sortField);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(schema.hackathons).where(where).orderBy(sortDir).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.hackathons).where(where),
  ]);

  return c.json({
    data,
    meta: { total: Number(countResult[0]?.count || 0), limit, offset },
  });
});

// GET /v1/hackathons/:idOrSlug — 详情
app.get('/:idOrSlug', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const param = c.req.param('idOrSlug');

  // UUID 格式检测
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
  const condition = isUuid
    ? eq(schema.hackathons.id, param)
    : eq(schema.hackathons.slug, param);

  const [hackathon] = await db.select().from(schema.hackathons).where(condition).limit(1);

  if (!hackathon) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Hackathon not found', status: 404 } },
      404
    );
  }

  return c.json({ data: hackathon });
});

export default app;
