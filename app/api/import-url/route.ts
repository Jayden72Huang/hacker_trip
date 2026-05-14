/**
 * API: 一键 URL 导入到草稿箱
 * POST /api/import-url
 *
 * 流程: URL → 爬取 → 图片识别(可选) → LLM 整理 → 存草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { draftHackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ScraperFactory } from '@/scrapers/utils/scraper-factory';
import { extractImageUrls, extractTextFromImages } from '@/lib/extract-from-images';
import { normalizeToDraftInsert } from '@/lib/normalize-hackathon';
import { chatCompletion } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供 URL' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL 格式无效' }, { status: 400 });
    }

    // 1. 查重
    const existing = await db
      .select({ id: draftHackathons.id, name: draftHackathons.name })
      .from(draftHackathons)
      .where(eq(draftHackathons.sourceUrl, url))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        existingDraftId: existing[0].id,
        existingName: existing[0].name,
        error: `该 URL 已导入过：${existing[0].name || '未命名'}`,
      }, { status: 409 });
    }

    const platform = ScraperFactory.identifyPlatform(url);

    // 2. 爬取
    const scrapeResult = await ScraperFactory.smartScrape(url);

    if (!scrapeResult.success || !scrapeResult.data) {
      return NextResponse.json({
        success: false,
        error: scrapeResult.error || '爬取失败',
        platform,
        suggestion: platform === '微信公众号'
          ? '微信文章可能需要验证，请尝试复制文章文字后使用「文本解析」'
          : platform === '小红书'
            ? '小红书可能被反爬拦截，请尝试复制笔记文字后使用「文本解析」'
            : '请检查 URL 是否可访问，或尝试复制页面文字后使用「文本解析」',
      }, { status: 422 });
    }

    // 3. 图片识别（如果有图片）
    let imageText = '';
    if (scrapeResult.rawMarkdown) {
      const imageUrls = extractImageUrls(scrapeResult.rawMarkdown);
      if (imageUrls.length > 0) {
        try {
          imageText = await extractTextFromImages(imageUrls);
        } catch (err) {
          console.warn('[import-url] 图片识别失败，继续使用纯文本:', err);
        }
      }
    }

    // 4. 如果有图片识别内容，合并后重新做 LLM 结构化提取
    let finalData = scrapeResult.data;
    if (imageText) {
      try {
        const mergedContent = buildMergedContent(scrapeResult, imageText);
        const aiResult = await aiParseToStructured(mergedContent);
        if (aiResult) {
          finalData = { ...scrapeResult.data, ...aiResult };
        }
      } catch (err) {
        console.warn('[import-url] AI 合并图文提取失败，使用纯文本结果:', err);
      }
    }

    // 5. 标准化字段并入库
    const normalized = normalizeToDraftInsert(finalData as Record<string, unknown>, {
      url,
      platform,
      confidence: scrapeResult.confidence,
    });

    if (!normalized.name) {
      return NextResponse.json({
        success: false,
        error: '无法从该链接中识别到黑客松活动信息',
        platform,
      }, { status: 422 });
    }

    const [row] = await db
      .insert(draftHackathons)
      .values(normalized)
      .returning();

    return NextResponse.json({
      success: true,
      draft: {
        draftId: row.id,
        name: row.name,
        shortName: row.shortName,
        city: row.city,
        venue: row.venue,
        dateRange: row.dateRange,
        startDate: row.startDate,
        endDate: row.endDate,
        prizePool: row.prizePool,
        teams: row.teams,
        theme: row.theme,
        summary: row.summary,
        format: row.format,
        organizers: row.organizers,
        sponsors: row.sponsors,
        tracks: row.tracks,
        confidence: row.confidence,
        platform,
      },
      confidence: row.confidence,
      platform,
      hasImageData: !!imageText,
    });
  } catch (error) {
    console.error('[import-url] error:', error);
    return NextResponse.json(
      { error: '服务器错误', detail: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

/**
 * 合并文本爬取结果 + 图片识别文字，生成一段完整描述
 */
function buildMergedContent(
  scrapeResult: { data?: Partial<Record<string, unknown>>; rawMarkdown?: string },
  imageText: string
): string {
  const parts: string[] = [];

  if (scrapeResult.rawMarkdown) {
    parts.push('=== 网页文字内容 ===');
    parts.push(scrapeResult.rawMarkdown.slice(0, 8000));
  }

  if (scrapeResult.data) {
    const d = scrapeResult.data;
    parts.push('\n=== 已提取的结构化信息 ===');
    if (d.name) parts.push(`名称: ${d.name}`);
    if (d.dateRange) parts.push(`日期: ${d.dateRange}`);
    if (d.city) parts.push(`城市: ${d.city}`);
    if (d.venue) parts.push(`场地: ${d.venue}`);
    if (d.prizePool) parts.push(`奖金: ${d.prizePool}`);
    if (d.theme) parts.push(`主题: ${d.theme}`);
  }

  parts.push('\n=== 图片中识别出的文字 ===');
  parts.push(imageText);

  return parts.join('\n');
}

/**
 * 将合并后的文本通过 LLM 做最终结构化提取
 */
async function aiParseToStructured(
  text: string
): Promise<Record<string, unknown> | null> {
  try {
    const result = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: `你是黑客松信息提取助手。从提供的网页文字+图片识别文字中，提取完整的黑客松活动信息。

严格按以下 JSON 格式输出，提取不到的留空字符串或空数组：
{
  "name": "活动全称",
  "shortName": "简称（2-6字）",
  "city": "举办城市（只填城市名）",
  "country": "国家（默认中国）",
  "venue": "场地名称",
  "dateRange": "日期范围原文",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "format": "offline/online/hybrid",
  "theme": "主题标语",
  "summary": "2-3句话概括",
  "prizePool": "奖金池（保留货币符号）",
  "teams": "参赛规模",
  "hostOrganizer": "主办方",
  "tracks": [{"title": "赛道名", "description": "描述"}],
  "agenda": [{"title": "环节", "time": "时间", "detail": "详情"}],
  "organizers": [{"name": "组织方"}],
  "sponsors": [{"name": "赞助商", "tier": "platinum/gold/silver/bronze"}]
}

规则：
- 图片文字和网页文字可能有重复，取更完整准确的版本
- 日期转 YYYY-MM-DD，没有年份默认 2026
- format: 线下=offline, 线上=online, 混合=hybrid
- 只返回 JSON`,
        },
        {
          role: 'user',
          content: `从以下内容中提取黑客松信息：\n\n${text.slice(0, 12000)}`,
        },
      ],
      maxTokens: 2048,
    });

    const cleaned = result.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('[import-url] AI 结构化提取失败:', err);
    return null;
  }
}
