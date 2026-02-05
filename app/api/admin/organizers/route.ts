/**
 * API: 管理员 - 组织者审核
 * GET  /api/admin/organizers - 获取所有组织者申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizerProfiles, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // 简单权限检查（实际应该检查 admin 角色）
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, all

    // 获取所有组织者申请，关联用户信息
    const profiles = await db
      .select({
        id: organizerProfiles.id,
        userId: organizerProfiles.userId,
        organizationName: organizerProfiles.organizationName,
        website: organizerProfiles.website,
        role: organizerProfiles.role,
        status: organizerProfiles.status,
        createdAt: organizerProfiles.createdAt,
        approvedAt: organizerProfiles.approvedAt,
        rejectedAt: organizerProfiles.rejectedAt,
        rejectionReason: organizerProfiles.rejectionReason,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(organizerProfiles)
      .leftJoin(users, eq(organizerProfiles.userId, users.id))
      .where(
        status && status !== 'all'
          ? eq(organizerProfiles.status, status as 'pending' | 'approved' | 'rejected')
          : undefined
      )
      .orderBy(desc(organizerProfiles.createdAt));

    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error) {
    console.error('Get organizer profiles error:', error);
    return NextResponse.json(
      { error: '获取组织者列表失败' },
      { status: 500 }
    );
  }
}
