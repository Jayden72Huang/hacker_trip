/**
 * API: 爬取 URL 并提取黑客松信息
 * POST /api/scrape
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScraperFactory } from '@/scrapers/utils/scraper-factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: '请提供 URL' },
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

    // 创建爬虫并执行
    const scraper = ScraperFactory.createScraper(url);
    const result = await scraper.scrape(url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '爬取失败' },
        { status: 500 }
      );
    }

    // 添加额外信息
    const enrichedData = {
      ...result.data,
      id: generateId(result.data?.name || 'unknown'),
      shortName: generateShortName(result.data?.name || ''),
      website: url,
      brief: url,
      isPast: false,
      status: 'upcoming'
    };

    return NextResponse.json({
      success: true,
      data: enrichedData,
      platform: ScraperFactory.identifyPlatform(url),
      confidence: result.confidence
    });

  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 生成 ID
 */
function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .slice(0, 30) + '-' + Date.now().toString(36);
}

/**
 * 生成短名称
 */
function generateShortName(name: string): string {
  // 移除常见后缀
  let shortName = name
    .replace(/黑客松|hackathon|大赛|竞赛/gi, '')
    .trim();

  // 限制长度
  if (shortName.length > 15) {
    shortName = shortName.slice(0, 15);
  }

  return shortName || name.slice(0, 10);
}
