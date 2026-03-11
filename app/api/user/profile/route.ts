import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({
      name: users.name,
      username: users.username,
      bio: users.bio,
      location: users.location,
      website: users.website,
      github: users.github,
      twitter: users.twitter,
      linkedin: users.linkedin,
      skills: users.skills,
      notificationPrefs: users.notificationPrefs,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  // 获取关联的 OAuth 账号提供商
  const linkedAccounts = await db
    .select({
      provider: accounts.provider,
    })
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));

  const providers = linkedAccounts.map((a) => a.provider);

  return NextResponse.json({
    ...user,
    skills: Array.isArray(user?.skills) ? (user.skills as string[]).join(', ') : '',
    providers,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const {
    name,
    username,
    bio,
    location,
    website,
    github,
    twitter,
    linkedin,
    skills,
    notificationPrefs,
  } = body;

  // 解析技能标签
  const skillsArray = typeof skills === 'string'
    ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(skills) ? skills : [];

  // 如果设置了 username，检查唯一性
  if (username) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 409 }
      );
    }
  }

  await db
    .update(users)
    .set({
      name: name || undefined,
      username: username || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
      github: github || null,
      twitter: twitter || null,
      linkedin: linkedin || null,
      skills: skillsArray,
      notificationPrefs: notificationPrefs || undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
