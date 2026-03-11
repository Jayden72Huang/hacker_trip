// Cloudflare Cron Trigger - 定时爬取黑客松信息
// 触发方式：Cloudflare Workers Cron / 手动调用
// Cron: "0 2 * * *" 每天凌晨2点 | "0 9 * * 1" 每周一上午9点

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeTargets, scrapeLogs, draftHackathons } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ScraperFactory } from '@/scrapers/utils/scraper-factory';

// 验证 Cron Secret（防止未授权调用）
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

export async function GET(request: NextRequest) {
  // 1. 验证授权
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== CRON_SECRET) {
    console.warn('[Cron] 未授权访问尝试');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 获取当前时间和调度类型
  const searchParams = request.nextUrl.searchParams;
  const scheduleType = searchParams.get('schedule') || 'daily'; // daily, weekly, hourly

  console.log(`[Cron] 开始执行定时爬取任务 - ${scheduleType} - ${new Date().toISOString()}`);

  try {
    // 3. 查询启用的爬取目标
    const targets = await db
      .select()
      .from(scrapeTargets)
      .where(
        and(
          eq(scrapeTargets.enabled, true),
          eq(scrapeTargets.schedule, scheduleType)
        )
      );

    if (targets.length === 0) {
      console.log(`[Cron] 没有找到 ${scheduleType} 类型的爬取目标`);
      return NextResponse.json({
        success: true,
        message: `没有启用的 ${scheduleType} 爬取目标`,
        targets: 0,
      });
    }

    console.log(`[Cron] 找到 ${targets.length} 个爬取目标`);

    // 4. 并发爬取所有目标
    const results = await Promise.allSettled(
      targets.map((target) => scrapeTarget(target))
    );

    // 5. 统计结果
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`[Cron] 爬取完成 - 成功: ${successCount}, 失败: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: '定时爬取任务完成',
      schedule: scheduleType,
      targets: targets.length,
      successful: successCount,
      failed: errorCount,
      results: results.map((r, i) => ({
        target: targets[i].name,
        settled: r.status,
        ...(r.status === 'fulfilled' ? r.value : { error: (r.reason as Error).message }),
      })),
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] 定时任务执行失败:', error);
    return NextResponse.json(
      {
        error: '定时任务执行失败',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 爬取单个目标
 */
async function scrapeTarget(target: any) {
  const startTime = Date.now();
  let logId: string | null = null;

  try {
    console.log(`[Scrape] 开始爬取: ${target.name} (${target.url})`);

    // 1. 创建爬取日志
    const [log] = await db
      .insert(scrapeLogs)
      .values({
        targetId: target.id,
        url: target.url,
        platform: target.platform,
        status: 'pending',
      })
      .returning();

    logId = log.id;

    // 2. 智能爬取：优先 Jina+LLM，降级传统爬虫
    const result = await ScraperFactory.smartScrape(target.url);

    const duration = Date.now() - startTime;

    if (!result.success) {
      throw new Error(result.error || '爬取失败');
    }

    // 3. 保存到草稿箱
    const draftData = {
      sourceUrl: target.url,
      platform: result.platform || target.platform,
      scrapeLogId: logId,
      ...result.data,
      confidence: Math.round((result.confidence || 0) * 100),
      rawData: result.data,
      status: 'pending' as const,
    };

    const [draft] = await db.insert(draftHackathons).values(draftData).returning();

    // 4. 更新爬取日志
    await db
      .update(scrapeLogs)
      .set({
        status: 'success',
        confidence: Math.round((result.confidence || 0) * 100),
        itemsFound: 1,
        itemsSaved: 1,
        duration,
        metadata: {
          draftId: draft.id,
          confidence: result.confidence,
        },
      })
      .where(eq(scrapeLogs.id, logId));

    // 5. 更新目标统计
    await db
      .update(scrapeTargets)
      .set({
        lastScrapedAt: new Date(),
        lastStatus: 'success',
        successCount: target.successCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(scrapeTargets.id, target.id));

    console.log(
      `[Scrape] 成功: ${target.name} - 置信度: ${result.confidence?.toFixed(2)} - ${duration}ms`
    );

    return {
      targetId: target.id,
      targetName: target.name,
      status: 'success',
      confidence: result.confidence,
      draftId: draft.id,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[Scrape] 失败: ${target.name} - ${errorMessage}`);

    // 更新日志和统计（包裹在 try-catch 中防止二次崩溃）
    try {
      if (logId) {
        await db
          .update(scrapeLogs)
          .set({
            status: 'error',
            errorMessage,
            duration,
          })
          .where(eq(scrapeLogs.id, logId));
      }

      await db
        .update(scrapeTargets)
        .set({
          lastScrapedAt: new Date(),
          lastStatus: 'error',
          errorCount: target.errorCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(scrapeTargets.id, target.id));
    } catch (dbError) {
      console.error(`[Scrape] 更新日志失败:`, dbError);
    }

    return {
      targetId: target.id,
      targetName: target.name,
      status: 'error',
      error: errorMessage,
      duration,
    };
  }
}

// 手动触发爬取（用于测试）
// POST /api/cron/scrape
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId } = body;

    if (!targetId) {
      return NextResponse.json({ error: '请提供 targetId' }, { status: 400 });
    }

    const [target] = await db
      .select()
      .from(scrapeTargets)
      .where(eq(scrapeTargets.id, targetId));

    if (!target) {
      return NextResponse.json({ error: '目标不存在' }, { status: 404 });
    }

    const result = await scrapeTarget(target);

    if (result.status === 'error') {
      return NextResponse.json({
        success: false,
        message: result.error,
        result,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: '手动爬取完成',
      result,
    });
  } catch (error) {
    console.error('[Manual Scrape] 失败:', error);
    return NextResponse.json(
      {
        error: '爬取失败',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
