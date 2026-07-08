/**
 * ============================================================================
 *  GET /api/identity/view?username=... — profileViews 自增（mock 社会证明）
 * ============================================================================
 *
 *  真实计数表后续接入；当前用进程内存 Map 做自增（mock 可观测）。
 *  无连接也能用，刷新页面计数 +1，便于本地验证裂变"社会证明"。
 *
 *  nodejs runtime。
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMockIdentity } from '@/lib/identity/mock';

export const runtime = 'nodejs';

// 进程内存计数（mock）。serverless 冷启动会重置，仅用于本地体验。
const viewCounts = new Map<string, number>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') ?? '').trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ ok: false, views: 0 }, { status: 400 });
  }

  // 以 mock 基线 profileViews 作为起点，叠加内存自增
  const base = getMockIdentity(username).profileViews;
  const inc = (viewCounts.get(username) ?? 0) + 1;
  viewCounts.set(username, inc);

  return NextResponse.json({ ok: true, views: base + inc });
}
