import { NextRequest, NextResponse } from 'next/server';
import { checkApprovedOrganizer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function ownsHackathon(id: string, userId: string): Promise<boolean> {
  const [hackathon] = await db
    .select({ createdBy: hackathons.createdBy })
    .from(hackathons)
    .where(eq(hackathons.id, id));

  return hackathon?.createdBy === userId;
}

/**
 * PATCH /api/organizer/hackathons/[id] — 更新当前组织者自己的黑客松
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!(await ownsHackathon(id, authResult.userId))) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = await request.json();

  const allowedFields: Record<string, unknown> = {};
  const editableKeys = [
    'name', 'description', 'website', 'startDate', 'endDate',
    'registrationDeadline', 'mode', 'location', 'prizePool',
    'organizer', 'tracks', 'tags', 'sponsors', 'logo', 'coverImage',
    'status',
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
 * DELETE /api/organizer/hackathons/[id] — 删除当前组织者自己的黑客松
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!(await ownsHackathon(id, authResult.userId))) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const [deleted] = await db
    .delete(hackathons)
    .where(eq(hackathons.id, id))
    .returning({ id: hackathons.id });

  if (!deleted) {
    return NextResponse.json({ error: '黑客松不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
