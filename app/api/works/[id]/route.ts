import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, workTeamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/works/[id] — 获取单个作品详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: '作品不存在' }, { status: 404 });
  }

  // 非公开或未通过审核的作品，只有作者可以查看
  if (!project.isPublic || project.verificationStatus !== 'approved') {
    const session = await auth();
    if (session?.user?.id !== project.userId) {
      // 允许作者查看自己的草稿
      if (!session?.user?.id || session.user.id !== project.userId) {
        return NextResponse.json({ error: '作品不存在' }, { status: 404 });
      }
    }
  }

  const teamMembers = await db
    .select()
    .from(workTeamMembers)
    .where(eq(workTeamMembers.projectId, id));

  return NextResponse.json({ data: { ...project, teamMembers } });
}

// PUT /api/works/[id] — 更新作品（仅作者 + draft/rejected 状态）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: '作品不存在或无权修改' }, { status: 404 });
  }

  if (existing.verificationStatus !== 'draft' && existing.verificationStatus !== 'rejected') {
    return NextResponse.json({ error: '只能修改草稿或被拒绝的作品' }, { status: 400 });
  }

  const body = await req.json();
  const {
    name, tagline, description, coverImage,
    demoUrl, repoUrl, videoUrl, devpostUrl,
    techStack, tracks, awards,
    hackathonId, hackathonName, externalHackathonUrl,
    roleInProject, screenshots, videoKey,
    teamMembers,
  } = body;

  const [updated] = await db
    .update(projects)
    .set({
      ...(name !== undefined && { name }),
      ...(tagline !== undefined && { tagline }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
      ...(demoUrl !== undefined && { demoUrl }),
      ...(repoUrl !== undefined && { repoUrl }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(devpostUrl !== undefined && { devpostUrl }),
      ...(techStack !== undefined && { techStack }),
      ...(tracks !== undefined && { tracks }),
      ...(awards !== undefined && { awards }),
      ...(hackathonId !== undefined && { hackathonId }),
      ...(hackathonName !== undefined && { hackathonName }),
      ...(externalHackathonUrl !== undefined && { externalHackathonUrl }),
      ...(roleInProject !== undefined && { roleInProject }),
      ...(screenshots !== undefined && { screenshots }),
      ...(videoKey !== undefined && { videoKey }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  // 更新团队成员（全量替换）
  if (teamMembers !== undefined) {
    await db.delete(workTeamMembers).where(eq(workTeamMembers.projectId, id));
    if (teamMembers.length > 0) {
      await db.insert(workTeamMembers).values(
        teamMembers.map((m: { name: string; role?: string; userId?: string; avatar?: string; github?: string; linkedin?: string }) => ({
          projectId: id,
          userId: m.userId || null,
          name: m.name,
          role: m.role || null,
          avatar: m.avatar || null,
          github: m.github || null,
          linkedin: m.linkedin || null,
        }))
      );
    }
  }

  return NextResponse.json({ data: updated });
}
