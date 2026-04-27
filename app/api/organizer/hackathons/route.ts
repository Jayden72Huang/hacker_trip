import { NextRequest, NextResponse } from 'next/server';
import { checkApprovedOrganizer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/organizer/hackathons — 获取当前组织者创建的黑客松
 */
export async function GET() {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const list = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.createdBy, authResult.userId))
    .orderBy(desc(hackathons.createdAt));

  return NextResponse.json(list);
}

/**
 * POST /api/organizer/hackathons — 组织者发布自己的黑客松
 */
export async function POST(request: NextRequest) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
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
      isVerified: false,
      isFeatured: false,
      createdBy: authResult.userId,
    })
    .returning();

  return NextResponse.json(hackathon);
}
