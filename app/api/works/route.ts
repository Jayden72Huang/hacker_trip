import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, workTeamMembers } from '@/lib/db/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';

// GET /api/works — 获取作品列表（公开或用户自己的）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine') === 'true';
  const q = searchParams.get('q');
  const hackathonId = searchParams.get('hackathonId');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (mine) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const data = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.updatedAt))
      .limit(limit)
      .offset(offset);
    return NextResponse.json({ data });
  }

  // 公开列表：只返回已通过审核的
  const conditions = [eq(projects.isPublic, true)];

  if (status === 'approved') {
    conditions.push(eq(projects.verificationStatus, 'approved'));
  } else {
    // 默认只显示已审核通过的
    conditions.push(eq(projects.verificationStatus, 'approved'));
  }
  if (q) conditions.push(ilike(projects.name, `%${q}%`));
  if (hackathonId) conditions.push(eq(projects.hackathonId, hackathonId));

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db.select().from(projects).where(where).orderBy(desc(projects.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(where),
  ]);

  return NextResponse.json({
    data,
    meta: { total: Number(countResult[0]?.count || 0), limit, offset },
  });
}

// POST /api/works — 创建新作品
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, tagline, description, coverImage,
    demoUrl, repoUrl, videoUrl, devpostUrl,
    techStack, tracks, awards,
    hackathonId, hackathonName, externalHackathonUrl,
    roleInProject, screenshots, videoKey,
    teamMembers, // [{ name, role, userId?, github?, linkedin? }]
    submitForReview, // true = 直接提交审核
  } = body;

  if (!name) {
    return NextResponse.json({ error: '作品名称不能为空' }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name,
      tagline: tagline || null,
      description: description || null,
      coverImage: coverImage || null,
      demoUrl: demoUrl || null,
      repoUrl: repoUrl || null,
      videoUrl: videoUrl || null,
      devpostUrl: devpostUrl || null,
      techStack: techStack || [],
      tracks: tracks || [],
      awards: awards || [],
      hackathonId: hackathonId || null,
      hackathonName: hackathonName || null,
      externalHackathonUrl: externalHackathonUrl || null,
      roleInProject: roleInProject || null,
      screenshots: screenshots || [],
      videoKey: videoKey || null,
      verificationStatus: submitForReview ? 'pending' : 'draft',
      isPublic: true,
    })
    .returning();

  // 添加团队成员
  if (teamMembers?.length > 0) {
    await db.insert(workTeamMembers).values(
      teamMembers.map((m: { name: string; role?: string; userId?: string; avatar?: string; github?: string; linkedin?: string }) => ({
        projectId: project.id,
        userId: m.userId || null,
        name: m.name,
        role: m.role || null,
        avatar: m.avatar || null,
        github: m.github || null,
        linkedin: m.linkedin || null,
      }))
    );
  }

  return NextResponse.json({ data: project }, { status: 201 });
}
