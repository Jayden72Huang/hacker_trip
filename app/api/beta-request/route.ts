import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { betaRequests } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { agentType, feedback } = await request.json();

    if (!agentType || typeof agentType !== 'string') {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查用户是否已经提交过这个 agent 的内测申请
    const existing = await db
      .select()
      .from(betaRequests)
      .where(eq(betaRequests.userId, session.user.id))
      .limit(1);

    const existingForAgent = existing.find(r => r.agentType === agentType);

    if (existingForAgent) {
      // 如果已经提交过，更新 feedback
      await db
        .update(betaRequests)
        .set({ feedback: feedback || existingForAgent.feedback })
        .where(eq(betaRequests.id, existingForAgent.id));
    } else {
      // 创建新的内测申请
      await db.insert(betaRequests).values({
        userId: session.user.id,
        agentType,
        feedback: feedback || null,
      });
    }

    // 获取总申请人数
    const [countResult] = await db
      .select({ value: count() })
      .from(betaRequests)
      .where(eq(betaRequests.agentType, agentType));

    return NextResponse.json({
      success: true,
      count: countResult?.value || 1,
    });
  } catch (error) {
    console.error('Beta request error:', error);
    return NextResponse.json(
      { error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType');

    if (!agentType) {
      return NextResponse.json(
        { error: '缺少 agentType 参数' },
        { status: 400 }
      );
    }

    // 获取总申请人数
    const [countResult] = await db
      .select({ value: count() })
      .from(betaRequests)
      .where(eq(betaRequests.agentType, agentType));

    return NextResponse.json({
      count: countResult?.value || 0,
    });
  } catch (error) {
    console.error('Get beta request count error:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}
