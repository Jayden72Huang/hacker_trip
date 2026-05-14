/**
 * API: 草稿箱 CRUD（数据库版）
 * GET    /api/drafts       - 获取所有草稿
 * POST   /api/drafts       - 创建草稿
 * PUT    /api/drafts        - 更新草稿
 * DELETE /api/drafts?draftId=xxx - 删除草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { draftHackathons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET: 获取所有草稿（status != 'published'）
 */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(draftHackathons)
      .orderBy(desc(draftHackathons.createdAt));

    // 转为前端期望的格式
    const drafts = rows.map((r) => ({
      draftId: r.id,
      name: r.name,
      shortName: r.shortName,
      city: r.city,
      country: r.country,
      venue: r.venue,
      dateRange: r.dateRange,
      startDate: r.startDate,
      endDate: r.endDate,
      mode: r.format,
      theme: r.theme,
      summary: r.summary,
      prizePool: r.prizePool,
      teams: r.teams,
      tracks: r.tracks,
      agenda: r.agenda,
      organizers: r.organizers,
      sponsors: r.sponsors,
      website: r.sourceUrl,
      source: r.sourceUrl,
      platform: r.platform,
      confidence: r.confidence,
      status: r.status,
      createdAt: r.createdAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    return NextResponse.json(
      { error: '读取草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * POST: 创建新草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, source = 'manual' } = body;

    if (!data) {
      return NextResponse.json(
        { error: '缺少数据' },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(draftHackathons)
      .values({
        sourceUrl: data.website || data.source || source,
        platform: data.platform || 'manual',
        name: data.name,
        shortName: data.shortName,
        city: data.city,
        country: data.country || '中国',
        venue: data.venue,
        dateRange: data.dateRange,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        format: data.mode || data.format,
        theme: data.theme,
        summary: data.summary,
        prizePool: data.prizePool,
        teams: data.teams,
        tracks: data.tracks || [],
        agenda: data.agenda || [],
        organizers: data.organizers || [],
        sponsors: data.sponsors || [],
        confidence: data.confidence,
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      success: true,
      draft: { draftId: row.id, ...data },
    });
  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json(
      { error: '创建草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 更新草稿
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftId, data } = body;

    if (!draftId || !data) {
      return NextResponse.json(
        { error: '缺少参数' },
        { status: 400 }
      );
    }

    const updateValues: Record<string, unknown> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.shortName !== undefined) updateValues.shortName = data.shortName;
    if (data.city !== undefined) updateValues.city = data.city;
    if (data.venue !== undefined) updateValues.venue = data.venue;
    if (data.dateRange !== undefined) updateValues.dateRange = data.dateRange;
    if (data.startDate !== undefined) updateValues.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateValues.endDate = new Date(data.endDate);
    if (data.mode !== undefined) updateValues.format = data.mode;
    if (data.theme !== undefined) updateValues.theme = data.theme;
    if (data.summary !== undefined) updateValues.summary = data.summary;
    if (data.prizePool !== undefined) updateValues.prizePool = data.prizePool;
    if (data.tracks !== undefined) updateValues.tracks = data.tracks;
    if (data.organizers !== undefined) updateValues.organizers = data.organizers;
    if (data.website !== undefined) updateValues.sourceUrl = data.website;

    const [updated] = await db
      .update(draftHackathons)
      .set(updateValues)
      .where(eq(draftHackathons.id, draftId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: '草稿不存在' },
        { status: 404 }
      );
    }

    const draft = {
      draftId: updated.id,
      name: updated.name,
      shortName: updated.shortName,
      city: updated.city,
      country: updated.country,
      venue: updated.venue,
      dateRange: updated.dateRange,
      startDate: updated.startDate,
      endDate: updated.endDate,
      mode: updated.format,
      theme: updated.theme,
      summary: updated.summary,
      prizePool: updated.prizePool,
      teams: updated.teams,
      tracks: updated.tracks,
      agenda: updated.agenda,
      organizers: updated.organizers,
      sponsors: updated.sponsors,
      website: updated.sourceUrl,
      source: updated.sourceUrl,
      platform: updated.platform,
      confidence: updated.confidence,
      status: updated.status,
      createdAt: updated.createdAt?.toISOString(),
    };
    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json(
      { error: '更新草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 删除草稿
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId) {
      return NextResponse.json(
        { error: '缺少 draftId' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(draftHackathons)
      .where(eq(draftHackathons.id, draftId))
      .returning({ id: draftHackathons.id });

    if (!deleted) {
      return NextResponse.json(
        { error: '草稿不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: '删除草稿失败' },
      { status: 500 }
    );
  }
}
