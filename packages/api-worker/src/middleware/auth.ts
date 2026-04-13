import { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDb, schema } from '../db/client';

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const apiKeyAuth = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid API key', status: 401 } },
        401
      );
    }

    const apiKey = authHeader.slice(7);
    if (!apiKey.startsWith('ht_live_') && !apiKey.startsWith('ht_test_')) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid API key format', status: 401 } },
        401
      );
    }

    const keyHash = await hashKey(apiKey);
    const db = createDb(c.env.DATABASE_URL);

    const [keyRecord] = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.keyHash, keyHash))
      .limit(1);

    if (!keyRecord || !keyRecord.isActive) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or deactivated API key', status: 401 } },
        401
      );
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'API key expired', status: 401 } },
        401
      );
    }

    // Store key info in context for rate limiting and logging
    c.set('apiKey' as never, keyRecord);

    await next();
  };
};
