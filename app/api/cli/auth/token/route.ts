import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let result = 'ht_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name || 'CLI Token';

  const apiKey = generateApiKey();
  const keyHash = await hashKey(apiKey);
  const keyPrefix = apiKey.slice(0, 12);

  await db.insert(apiKeys).values({
    userId: session.user.id,
    name,
    keyHash,
    keyPrefix,
    tier: 'free',
    scopes: ['read', 'write', 'cli'],
  });

  return NextResponse.json({
    apiKey,
    prefix: keyPrefix,
    message: 'Save this key — it will not be shown again.',
  });
}
