/**
 * API: 管理员 - 组织者审核
 * GET  /api/admin/organizers - 获取所有组织者申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizerProfiles, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdmin();
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
