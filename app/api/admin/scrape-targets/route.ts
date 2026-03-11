/**
 * API: 爬取目标管理
 * GET    /api/admin/scrape-targets       - 获取所有爬取目标
 * POST   /api/admin/scrape-targets       - 创建爬取目标
 * PUT    /api/admin/scrape-targets/:id   - 更新爬取目标
 * DELETE /api/admin/scrape-targets/:id   - 删除爬取目标
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeTargets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET - 获取所有爬取目标
 */
export async function GET() {
  try {
    const targets = await db
      .select()
      .from(scrapeTargets)
      .orderBy(desc(scrapeTargets.createdAt));

    return NextResponse.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    console.error('[ScrapeTargets] 获取失败:', error);
    return NextResponse.json(
      { error: '获取爬取目标失败' },
      { status: 500 }
    );
  }
}

/**
 * POST - 创建爬取目标
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, platform, schedule, enabled } = body;

    // 验证必填字段
    if (!name || !url || !platform || !schedule) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证 URL 格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'URL 格式无效' },
        { status: 400 }
      );
    }

    // 验证 schedule
    const validSchedules = ['daily', 'weekly', 'hourly', 'custom'];
    if (!validSchedules.includes(schedule)) {
      return NextResponse.json(
        { error: `schedule 必须是 ${validSchedules.join(', ')} 之一` },
        { status: 400 }
      );
    }

    // 创建目标
    const [target] = await db
      .insert(scrapeTargets)
      .values({
        name,
        url,
        platform,
        schedule,
        enabled: enabled ?? true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: target,
      message: '爬取目标创建成功',
    });
  } catch (error) {
    console.error('[ScrapeTargets] 创建失败:', error);
    return NextResponse.json(
      { error: '创建爬取目标失败' },
      { status: 500 }
    );
  }
}
