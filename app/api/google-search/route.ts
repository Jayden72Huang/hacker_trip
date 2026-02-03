/**
 * API: Google Custom Search - 黑客松检索
 * POST /api/google-search
 */

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;

type SearchRequest = {
  query: string;
  num?: number;
  language?: string;
  region?: string;
  dateRestrict?: string;
  sites?: string[] | string;
};

function buildSiteQuery(sites?: string[] | string) {
  if (!sites) return '';
  const list = Array.isArray(sites)
    ? sites
    : sites.split(',').map((site) => site.trim()).filter(Boolean);
  if (list.length === 0) return '';
  return list.map((site) => `site:${site}`).join(' OR ');
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_CX) {
      return NextResponse.json(
        { error: 'Google API 未配置，请设置 GOOGLE_CSE_API_KEY 和 GOOGLE_CSE_CX' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as SearchRequest;
    const rawQuery = body.query?.trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: '请提供检索关键词' },
        { status: 400 }
      );
    }

    const hasHackathonKeyword = /hackathon|黑客松/i.test(rawQuery);
    const siteQuery = buildSiteQuery(body.sites);
    const finalQuery = [
      rawQuery,
      hasHackathonKeyword ? '' : '(黑客松 OR hackathon)',
      siteQuery ? `(${siteQuery})` : ''
    ].filter(Boolean).join(' ');

    const params = new URLSearchParams({
      key: GOOGLE_CSE_API_KEY,
      cx: GOOGLE_CSE_CX,
      q: finalQuery,
      num: String(Math.min(Math.max(body.num || 8, 1), 10)),
      hl: body.language || 'zh-CN',
      safe: 'active',
      fields: 'items(title,link,snippet,displayLink,formattedUrl)'
    });

    if (body.region && body.region !== 'global') {
      params.set('gl', body.region);
    }

    if (body.dateRestrict) {
      params.set('dateRestrict', body.dateRestrict);
    }

    const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Google 搜索失败' },
        { status: response.status }
      );
    }

    const items = (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink || item.formattedUrl
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Google search error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
