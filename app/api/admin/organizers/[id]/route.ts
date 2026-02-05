/**
 * API: 管理员 - 组织者审核操作
 * PATCH /api/admin/organizers/[id] - 审核组织者申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizerProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '无效的操作' },
        { status: 400 }
      );
    }

    // 检查申请是否存在
    const profile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.id, id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: '申请不存在' },
        { status: 404 }
      );
    }

    // 执行审核操作
    if (action === 'approve') {
      await db
        .update(organizerProfiles)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        })
        .where(eq(organizerProfiles.id, id));
    } else {
      await db
        .update(organizerProfiles)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || '申请信息不符合要求',
          approvedAt: null,
        })
        .where(eq(organizerProfiles.id, id));
    }

    // 获取更新后的数据
    const updatedProfile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.id, id),
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Review organizer error:', error);
    return NextResponse.json(
      { error: '审核操作失败' },
      { status: 500 }
    );
  }
}
