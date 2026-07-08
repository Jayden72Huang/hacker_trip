/**
 * API: 单个爬取目标管理
 * PUT    /api/admin/scrape-targets/:id   - 更新爬取目标
 * DELETE /api/admin/scrape-targets/:id   - 删除爬取目标
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeTargets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdmin } from '@/lib/auth-helpers';

async function requireAdmin() {
  const authResult = await checkAdmin();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * PUT - 更新爬取目标
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { name, url, platform, schedule, enabled } = body;

    // 验证 URL 格式（如果提供了）
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'URL 格式无效' },
          { status: 400 }
        );
      }
    }

    // 验证 schedule（如果提供了）
    if (schedule) {
      const validSchedules = ['daily', 'weekly', 'hourly', 'custom'];
      if (!validSchedules.includes(schedule)) {
        return NextResponse.json(
          { error: `schedule 必须是 ${validSchedules.join(', ')} 之一` },
          { status: 400 }
        );
      }
    }

    // 更新目标
    const [target] = await db
      .update(scrapeTargets)
      .set({
        ...(name && { name }),
        ...(url && { url }),
        ...(platform && { platform }),
        ...(schedule && { schedule }),
        ...(enabled !== undefined && { enabled }),
        updatedAt: new Date(),
      })
      .where(eq(scrapeTargets.id, id))
      .returning();

    if (!target) {
      return NextResponse.json(
        { error: '爬取目标不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: target,
      message: '爬取目标更新成功',
    });
  } catch (error) {
    console.error('[ScrapeTargets] 更新失败:', error);
    return NextResponse.json(
      { error: '更新爬取目标失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除爬取目标
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const [deleted] = await db
      .delete(scrapeTargets)
      .where(eq(scrapeTargets.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: '爬取目标不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '爬取目标删除成功',
    });
  } catch (error) {
    console.error('[ScrapeTargets] 删除失败:', error);
    return NextResponse.json(
      { error: '删除爬取目标失败' },
      { status: 500 }
    );
  }
}
