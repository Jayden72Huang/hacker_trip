import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/admin/articles — 获取文章列表（按状态筛选）
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'in_review';

  const data = await db
    .select({
      article: articles,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.status, status as 'invited' | 'draft' | 'in_review' | 'published' | 'rejected'))
    .orderBy(desc(articles.createdAt));

  return NextResponse.json({ data });
}

// POST /api/admin/articles — 创建邀请稿件
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = await req.json();
  const { authorId, type, title, relatedHackathonId } = body;

  if (!authorId || !type) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const validTypes = ['experience', 'interview', 'guest_post'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: '无效的文章类型' }, { status: 400 });
  }

  // 确认作者存在
  const [author] = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
  if (!author) {
    return NextResponse.json({ error: '作者不存在' }, { status: 404 });
  }

  const slug = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [article] = await db
    .insert(articles)
    .values({
      slug,
      title: title || '待填写标题',
      type: type as 'experience' | 'interview' | 'guest_post',
      content: '',
      authorId,
      relatedHackathonId: relatedHackathonId || null,
      status: 'invited',
      invitedBy: session.user.id,
      invitedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: article });
}
