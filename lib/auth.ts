import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Resend({
      from: process.env.EMAIL_FROM || 'HackerTrip <noreply@hackertrip.space>',
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        (session.user as { role?: string }).role = (user as { role?: string }).role || 'user';
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // 没有头像的新用户分配像素风默认头像
      if (!user.image && user.id) {
        const seed = encodeURIComponent(user.name || user.email || user.id);
        const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}`;
        const { db: database } = await import('./db');
        const { users } = await import('./db/schema');
        const { eq } = await import('drizzle-orm');
        await database.update(users).set({ image: avatarUrl }).where(eq(users.id, user.id));
      }
    },
  },
});
