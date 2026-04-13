import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, verificationLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/works/[id]/submit — 提交作品审核
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: '作品不存在或无权操作' }, { status: 404 });
  }

  if (project.verificationStatus !== 'draft' && project.verificationStatus !== 'rejected') {
    return NextResponse.json({ error: '当前状态不允许提交审核' }, { status: 400 });
  }

  if (!project.name) {
    return NextResponse.json({ error: '作品名称不能为空' }, { status: 400 });
  }

  // 轻量验证：检查基本信息完整性
  const checks: Record<string, boolean> = {
    hasName: !!project.name,
    hasDescription: !!project.description,
    hasHackathon: !!(project.hackathonId || project.hackathonName || project.externalHackathonUrl),
  };

  // 异步做 GitHub/Demo URL 可达性检查（不阻塞提交）
  const urlChecks: Record<string, { reachable: boolean; status?: number }> = {};

  if (project.repoUrl) {
    try {
      const res = await fetch(project.repoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      urlChecks.repoUrl = { reachable: res.ok, status: res.status };
    } catch {
      urlChecks.repoUrl = { reachable: false };
    }
  }

  if (project.demoUrl) {
    try {
      const res = await fetch(project.demoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      urlChecks.demoUrl = { reachable: res.ok, status: res.status };
    } catch {
      urlChecks.demoUrl = { reachable: false };
    }
  }

  // 简单置信度评分
  let score = 0;
  if (checks.hasName) score += 15;
  if (checks.hasDescription) score += 15;
  if (checks.hasHackathon) score += 20;
  if (urlChecks.repoUrl?.reachable) score += 25;
  if (urlChecks.demoUrl?.reachable) score += 15;
  if ((project.screenshots as string[])?.length > 0) score += 10;

  const aiReviewResult = { checks, urlChecks, score };

  // 更新为 pending 状态（直接跳过 ai_reviewed，因为验证很轻量）
  await db
    .update(projects)
    .set({
      verificationStatus: 'pending',
      aiConfidenceScore: score,
      aiReviewResult: aiReviewResult,
      aiReviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  // 记录日志
  await db.insert(verificationLogs).values({
    projectId: id,
    action: 'submitted',
    actorId: session.user.id,
    details: aiReviewResult,
  });

  return NextResponse.json({ data: { status: 'pending', score, checks: aiReviewResult } });
}
