import { NextRequest, NextResponse } from 'next/server';
import { checkApprovedOrganizer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { draftHackathons } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

type DraftRow = typeof draftHackathons.$inferSelect;

function normalizeConfidence(confidence: unknown): number | null {
  if (typeof confidence !== 'number') return null;
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string | undefined {
  if (!startDate || !endDate) return undefined;
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  return start === end ? start : `${start} ~ ${end}`;
}

function toClientDraft(draft: DraftRow) {
  const dateRange = draft.dateRange || formatDateRange(draft.startDate, draft.endDate);

  return {
    draftId: draft.id,
    source: draft.sourceUrl,
    sourceUrl: draft.sourceUrl,
    platform: draft.platform,
    createdAt: draft.createdAt?.toISOString() ?? new Date().toISOString(),
    draftStatus: draft.status || 'pending',
    status: draft.status,
    rawData: draft.rawData,
    confidence: typeof draft.confidence === 'number' ? draft.confidence / 100 : undefined,
    name: draft.name,
    shortName: draft.shortName,
    city: draft.city,
    country: draft.country,
    venue: draft.venue,
    dateRange,
    startDate: draft.startDate?.toISOString().split('T')[0],
    endDate: draft.endDate?.toISOString().split('T')[0],
    format: draft.format,
    mode: draft.format,
    theme: draft.theme,
    summary: draft.summary,
    prizePool: draft.prizePool,
    teams: draft.teams,
    website: draft.sourceUrl,
    tracks: draft.tracks,
    agenda: draft.agenda,
    organizers: draft.organizers,
    sponsors: draft.sponsors,
  };
}

function draftFieldsFromData(data: Record<string, unknown>, source?: string) {
  const sourceUrl = String(data.sourceUrl || data.website || source || 'manual');

  return {
    sourceUrl,
    platform: typeof data.platform === 'string' ? data.platform : null,
    name: typeof data.name === 'string' ? data.name : null,
    shortName: typeof data.shortName === 'string' ? data.shortName : null,
    city: typeof data.city === 'string' ? data.city : null,
    country: typeof data.country === 'string' ? data.country : '中国',
    venue: typeof data.venue === 'string' ? data.venue : null,
    dateRange: typeof data.dateRange === 'string' ? data.dateRange : null,
    startDate: parseOptionalDate(data.startDate),
    endDate: parseOptionalDate(data.endDate),
    format: typeof data.format === 'string'
      ? data.format
      : typeof data.mode === 'string'
        ? data.mode
        : 'hybrid',
    theme: typeof data.theme === 'string' ? data.theme : null,
    summary: typeof data.summary === 'string' ? data.summary : null,
    prizePool: typeof data.prizePool === 'string' ? data.prizePool : null,
    teams: typeof data.teams === 'string' ? data.teams : null,
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
    agenda: Array.isArray(data.agenda) ? data.agenda : [],
    organizers: Array.isArray(data.organizers) ? data.organizers : [],
    sponsors: Array.isArray(data.sponsors) ? data.sponsors : [],
    confidence: normalizeConfidence(data.confidence),
    rawData: data.rawData || data,
    status: typeof data.draftStatus === 'string'
      ? data.draftStatus
      : typeof data.status === 'string'
        ? data.status
        : 'pending',
  };
}

/**
 * GET /api/organizer/drafts — 获取当前组织者的草稿
 */
export async function GET() {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const drafts = await db
    .select()
    .from(draftHackathons)
    .where(eq(draftHackathons.createdBy, authResult.userId))
    .orderBy(desc(draftHackathons.createdAt));

  return NextResponse.json({
    success: true,
    drafts: drafts.map(toClientDraft),
  });
}

/**
 * POST /api/organizer/drafts — 创建当前组织者的草稿
 */
export async function POST(request: NextRequest) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { data, source = 'manual' } = body;

  if (!data) {
    return NextResponse.json({ error: '缺少数据' }, { status: 400 });
  }

  const [draft] = await db
    .insert(draftHackathons)
    .values({
      ...draftFieldsFromData(data, source),
      createdBy: authResult.userId,
    })
    .returning();

  return NextResponse.json({
    success: true,
    draft: toClientDraft(draft),
  });
}

/**
 * PUT /api/organizer/drafts — 更新当前组织者的草稿
 */
export async function PUT(request: NextRequest) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { draftId, data } = body;

  if (!draftId || !data) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  const [updated] = await db
    .update(draftHackathons)
    .set(draftFieldsFromData(data, data.source))
    .where(and(
      eq(draftHackathons.id, draftId),
      eq(draftHackathons.createdBy, authResult.userId)
    ))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    draft: toClientDraft(updated),
  });
}

/**
 * DELETE /api/organizer/drafts — 删除当前组织者的草稿
 */
export async function DELETE(request: NextRequest) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const draftId = searchParams.get('draftId');

  if (!draftId) {
    return NextResponse.json({ error: '缺少 draftId' }, { status: 400 });
  }

  const [deleted] = await db
    .delete(draftHackathons)
    .where(and(
      eq(draftHackathons.id, draftId),
      eq(draftHackathons.createdBy, authResult.userId)
    ))
    .returning({ id: draftHackathons.id });

  if (!deleted) {
    return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
