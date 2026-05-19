import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { count, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const [row] = await db
      .select({ count: count() })
      .from(subscribers)
      .where(isNull(subscribers.unsubscribedAt));

    return NextResponse.json({ count: row?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
