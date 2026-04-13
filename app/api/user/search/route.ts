import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { ilike, or, sql } from 'drizzle-orm';

// GET /api/user/search?q=xxx — 搜索用户（需要登录，admin 用于邀请投稿）
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const pattern = `%${q}%`;
  const data = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      email: users.email,
    })
    .from(users)
    .where(
      or(
        ilike(users.name, pattern),
        ilike(users.email, pattern),
        ilike(users.username, pattern),
      )
    )
    .limit(10);

  return NextResponse.json({ data });
}
