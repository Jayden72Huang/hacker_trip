import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq, desc, asc, ilike, or, sql } from 'drizzle-orm';
import { toHomepageHackathon } from '@/lib/types/hackathon';

/**
 * GET /api/hackathons — 公开接口：查询已发布的黑客松
 * 支持: ?q=搜索 &mode=online|offline|hybrid &status=upcoming|ongoing|ended &featured=true &sort=date|name
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || '';
  const mode = searchParams.get('mode');
  const status = searchParams.get('status');
  const featured = searchParams.get('featured');
  const sort = searchParams.get('sort') || 'date';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(hackathons.name, `%${q}%`),
        ilike(hackathons.location, `%${q}%`),
        ilike(hackathons.organizer, `%${q}%`),
      )
    );
  }

  if (mode && ['online', 'offline', 'hybrid'].includes(mode)) {
    conditions.push(eq(hackathons.mode, mode as 'online' | 'offline' | 'hybrid'));
  }

  if (status && ['upcoming', 'ongoing', 'ended'].includes(status)) {
    conditions.push(eq(hackathons.status, status as 'upcoming' | 'ongoing' | 'ended'));
  }

  if (featured === 'true') {
    conditions.push(eq(hackathons.isFeatured, true));
  }

  const orderBy = sort === 'name'
    ? asc(hackathons.name)
    : desc(hackathons.startDate);

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined;

  const results = await db
    .select()
    .from(hackathons)
    .where(where)
    .orderBy(orderBy)
    .limit(limit);

  const enriched = results.map(toHomepageHackathon);
  return NextResponse.json(enriched);
}
