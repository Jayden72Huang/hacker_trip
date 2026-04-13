import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateRecommendations } from '@/lib/recommendations/engine';

// POST /api/recommendations/generate — 触发重新生成推荐
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const results = await generateRecommendations(session.user.id);
    return NextResponse.json({
      data: results,
      meta: { count: results.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `推荐生成失败: ${message}` },
      { status: 500 }
    );
  }
}
