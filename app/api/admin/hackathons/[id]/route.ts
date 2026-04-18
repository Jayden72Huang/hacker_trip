import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/admin/hackathons/[id] — 更新黑客松（状态、精选、编辑）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  // 只允许更新特定字段
  const allowedFields: Record<string, unknown> = {};
  const editableKeys = [
    'name', 'description', 'website', 'startDate', 'endDate',
    'registrationDeadline', 'mode', 'location', 'prizePool',
    'organizer', 'tracks', 'tags', 'sponsors', 'logo', 'coverImage',
    'status', 'isFeatured', 'isVerified',
    'shortName', 'city', 'country', 'venue', 'theme', 'summary',
    'teams', 'brief', 'hostOrganizer', 'agenda', 'registration',
    'infoCards', 'organizers',
  ];

  for (const key of editableKeys) {
    if (key in body) {
      if (['startDate', 'endDate', 'registrationDeadline'].includes(key) && body[key]) {
        allowedFields[key] = new Date(body[key]);
      } else {
        allowedFields[key] = body[key];
      }
    }
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
  }

  allowedFields.updatedAt = new Date();

  const [updated] = await db
    .update(hackathons)
    .set(allowedFields)
    .where(eq(hackathons.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: '黑客松不存在' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/hackathons/[id] — 删除黑客松
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(hackathons)
    .where(eq(hackathons.id, id))
    .returning({ id: hackathons.id });

  if (!deleted) {
    return NextResponse.json({ error: '黑客松不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
