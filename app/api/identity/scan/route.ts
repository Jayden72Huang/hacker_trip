/**
 * ============================================================================
 *  POST /api/identity/scan — 接 ht-scan-project 结果 → DevConfig（mock 降级）
 * ============================================================================
 *
 *  请求体可选携带 ht-scan-project 的扫描结果（ScanProjectResult）。
 *  - 有 body：用 devConfigFromScan 归一为 DevConfig 返回。
 *  - 无 body / 解析失败：返回一份示例扫描结果，演示"一键导入"效果（本地无扫描时降级）。
 *
 *  绝不抛错阻断前端。nodejs runtime。
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { devConfigFromScan, type ScanProjectResult } from '@/lib/identity/config';

export const runtime = 'nodejs';

/** 本地无真实扫描时的示例项目（演示从零到一搭建者画像） */
const DEMO_SCAN: ScanProjectResult = {
  techStack: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
  domain: ['ai', 'fullstack', 'growth'],
  aiTools: ['Claude Code', 'Claude', 'v0'],
  tools: ['VS Code', 'Vercel', 'Neon', 'GitHub'],
};

export async function POST(req: NextRequest) {
  let scan: ScanProjectResult | null = null;
  let fromDemo = false;

  try {
    const body = (await req.json()) as Partial<ScanProjectResult> | null;
    if (body && (body.techStack?.length || body.domain || body.aiTools?.length)) {
      scan = body as ScanProjectResult;
    } else {
      scan = DEMO_SCAN;
      fromDemo = true;
    }
  } catch {
    scan = DEMO_SCAN;
    fromDemo = true;
  }

  const config = devConfigFromScan(scan, undefined);

  return NextResponse.json({
    ok: true,
    fromDemo,
    config,
    // 用于演示判定的项目描述关键词
    taglineKeywords: ['mvp', 'fullstack', 'next', 'ship', 'fast', 'prototype', 'demo'],
  });
}
