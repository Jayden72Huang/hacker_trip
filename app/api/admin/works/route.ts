import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, users } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// GET /api/admin/works — 获取待审核作品列表
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 检查 admin 权限
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const data = await db
    .select({
      project: projects,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .where(eq(projects.verificationStatus, status as 'pending' | 'ai_reviewed' | 'approved' | 'rejected' | 'draft'))
    .orderBy(desc(projects.createdAt));

  return NextResponse.json({ data });
}
