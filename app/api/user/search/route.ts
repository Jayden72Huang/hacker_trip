import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { ilike, or } from 'drizzle-orm';
import { checkAdmin } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const authResult = await checkAdmin();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
