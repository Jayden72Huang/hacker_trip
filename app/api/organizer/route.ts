/**
 * API: 组织者档案
 * GET  /api/organizer - 获取当前用户的组织者档案
 * POST /api/organizer - 申请成为组织者
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizerProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET: 获取当前用户的组织者档案
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const profile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.userId, session.user.id),
    });

    return NextResponse.json({
      success: true,
      profile: profile || null,
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    return NextResponse.json(
      { error: '获取组织者档案失败' },
      { status: 500 }
    );
  }
}

/**
 * POST: 申请成为组织者
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 检查是否已经申请过
    const existingProfile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.userId, session.user.id),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: '您已经提交过申请', profile: existingProfile },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { organizationName, website, role } = body;

    if (!organizationName || !role) {
      return NextResponse.json(
        { error: '请填写必要信息' },
        { status: 400 }
      );
    }

    // 创建组织者档案
    const [newProfile] = await db
      .insert(organizerProfiles)
      .values({
        userId: session.user.id,
        organizationName,
        website: website || null,
        role,
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      success: true,
      profile: newProfile,
    });
  } catch (error) {
    console.error('Create organizer profile error:', error);
    return NextResponse.json(
      { error: '申请失败，请稍后重试' },
      { status: 500 }
    );
  }
}
