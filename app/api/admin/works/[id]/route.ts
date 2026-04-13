import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, users, verificationLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/admin/works/[id] — 审核通过/拒绝
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body; // action: 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  }

  const [updated] = await db
    .update(projects)
    .set({
      verificationStatus: action === 'approve' ? 'approved' : 'rejected',
      adminReviewerId: session.user.id,
      adminReviewNotes: notes || null,
      adminReviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: '作品不存在' }, { status: 404 });
  }

  // 记录日志
  await db.insert(verificationLogs).values({
    projectId: id,
    action: action === 'approve' ? 'admin_approve' : 'admin_reject',
    actorId: session.user.id,
    details: { notes },
  });

  return NextResponse.json({ data: updated });
}
