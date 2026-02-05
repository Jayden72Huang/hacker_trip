import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, projects } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    const [userCount] = await db.select({ value: count() }).from(users);
    const [projectCount] = await db.select({ value: count() }).from(projects);

    return NextResponse.json({
      userCount: userCount?.value || 0,
      projectCount: projectCount?.value || 0,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({
      userCount: 0,
      projectCount: 0,
    });
  }
}
