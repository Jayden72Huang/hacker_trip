import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/hackathons — 获取所有已发布的黑客松（Admin）
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const list = await db
    .select()
    .from(hackathons)
    .orderBy(desc(hackathons.createdAt));

  return NextResponse.json(list);
}

/**
 * POST /api/admin/hackathons — 从草稿发布黑客松
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, website, startDate, endDate, mode, location,
    prizePool, organizer, tracks, tags, sponsors, logo, coverImage,
    registrationDeadline, sourceUrl,
    shortName, city, country, venue, theme, summary, teams, brief,
    hostOrganizer, agenda, registration, infoCards, organizers } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: '名称和日期为必填' }, { status: 400 });
  }

  // 生成 slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    || `hackathon-${Date.now()}`;

  const [hackathon] = await db
    .insert(hackathons)
    .values({
      name,
      slug,
      description: description || null,
      website: website || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      mode: mode || 'hybrid',
      location: location || null,
      prizePool: prizePool || null,
      organizer: organizer || null,
      tracks: tracks || [],
      tags: tags || [],
      sponsors: sponsors || [],
      logo: logo || null,
      coverImage: coverImage || null,
      sourceUrl: sourceUrl || null,
      shortName: shortName || null,
      city: city || null,
      country: country || '中国',
      venue: venue || null,
      theme: theme || null,
      summary: summary || null,
      teams: teams || null,
      brief: brief || null,
      hostOrganizer: hostOrganizer || null,
      agenda: agenda || [],
      registration: registration || null,
      infoCards: infoCards || null,
      organizers: organizers || [],
      status: 'upcoming',
      isVerified: true,
      isFeatured: false,
    })
    .returning();

  return NextResponse.json(hackathon);
}
