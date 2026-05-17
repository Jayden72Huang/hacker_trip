import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const state = url.searchParams.get('state');

  if (!state) {
    return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
  }

  if (!session?.user?.id) {
    const signInUrl = new URL('/api/auth/signin', BASE_URL);
    signInUrl.searchParams.set('callbackUrl', `${BASE_URL}/api/cli/auth?state=${state}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.json({
    message: 'Authenticated. Use POST /api/cli/auth/token to generate an API key.',
    userId: session.user.id,
    state,
  });
}
