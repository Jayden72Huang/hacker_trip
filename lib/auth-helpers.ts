import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizerProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type AuthResult =
  | { authorized: false }
  | { authorized: true; userId: string };

export async function checkAdmin(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) return { authorized: false };

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (user?.role !== 'admin') return { authorized: false };

  return { authorized: true, userId: session.user.id };
}

export async function checkApprovedOrganizer(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) return { authorized: false };

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (user?.role === 'admin') {
    return { authorized: true, userId: session.user.id };
  }

  if (user?.role !== 'organizer') return { authorized: false };

  const [profile] = await db
    .select({ status: organizerProfiles.status })
    .from(organizerProfiles)
    .where(eq(organizerProfiles.userId, session.user.id));

  if (profile?.status !== 'approved') return { authorized: false };

  return { authorized: true, userId: session.user.id };
}
