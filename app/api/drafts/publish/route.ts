import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { draftHackathons, hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `hackathon-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: '缺少 draftId' }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(draftHackathons)
      .where(eq(draftHackathons.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
    }

    if (draft.publishedHackathonId) {
      return NextResponse.json({ error: '该草稿已发布' }, { status: 400 });
    }

    if (!draft.name || !draft.startDate || !draft.endDate) {
      return NextResponse.json(
        { error: '缺少必要字段：名称、开始日期、结束日期' },
        { status: 400 }
      );
    }

    const baseSlug = generateSlug(draft.shortName || draft.name);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await db
        .select({ id: hackathons.id })
        .from(hackathons)
        .where(eq(hackathons.slug, slug))
        .limit(1);
      if (existing.length === 0) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const location = [draft.city, draft.venue].filter(Boolean).join(' · ');

    const [hackathon] = await db
      .insert(hackathons)
      .values({
        name: draft.name,
        slug,
        shortName: draft.shortName,
        description: draft.summary,
        summary: draft.summary,
        website: draft.sourceUrl,
        sourceUrl: draft.sourceUrl,
        startDate: draft.startDate,
        endDate: draft.endDate,
        mode: (draft.format as 'offline' | 'online' | 'hybrid') || 'hybrid',
        location,
        city: draft.city,
        country: draft.country,
        venue: draft.venue,
        theme: draft.theme,
        prizePool: draft.prizePool,
        teams: draft.teams,
        tracks: draft.tracks,
        agenda: draft.agenda,
        organizers: draft.organizers,
        sponsors: draft.sponsors,
        hostOrganizer: Array.isArray(draft.organizers) && draft.organizers.length > 0
          ? (draft.organizers as { name: string }[])[0].name
          : undefined,
        status: 'upcoming',
        isVerified: false,
        isFeatured: false,
        createdBy: draft.createdBy,
      })
      .returning();

    await db
      .update(draftHackathons)
      .set({
        status: 'published',
        publishedHackathonId: hackathon.id,
        publishedAt: new Date(),
      })
      .where(eq(draftHackathons.id, draftId));

    return NextResponse.json({
      success: true,
      hackathon: {
        id: hackathon.id,
        name: hackathon.name,
        slug: hackathon.slug,
      },
    });
  } catch (error) {
    console.error('Publish draft error:', error);
    return NextResponse.json(
      { error: '发布失败，请稍后重试' },
      { status: 500 }
    );
  }
}
