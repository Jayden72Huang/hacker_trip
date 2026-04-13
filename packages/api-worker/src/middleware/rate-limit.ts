import { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export const rateLimit = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const apiKey = c.get('apiKey' as never) as { keyHash: string; rateLimitRpm: number; rateLimitRpd: number } | undefined;
    if (!apiKey) {
      await next();
      return;
    }

    const now = new Date();
    const minuteBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
    const dayBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

    const minuteKey = `rl:min:${apiKey.keyHash.slice(0, 16)}:${minuteBucket}`;
    const dayKey = `rl:day:${apiKey.keyHash.slice(0, 16)}:${dayBucket}`;

    const kv = c.env.RATE_LIMIT_KV;

    // Check minute limit
    const minuteCount = parseInt((await kv.get(minuteKey)) || '0', 10);
    if (minuteCount >= apiKey.rateLimitRpm) {
      c.header('X-RateLimit-Limit', String(apiKey.rateLimitRpm));
      c.header('X-RateLimit-Remaining', '0');
      c.header('Retry-After', '60');
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded', status: 429 } },
        429
      );
    }

    // Check daily limit
    const dayCount = parseInt((await kv.get(dayKey)) || '0', 10);
    if (dayCount >= apiKey.rateLimitRpd) {
      c.header('X-RateLimit-Limit', String(apiKey.rateLimitRpd));
      c.header('X-RateLimit-Remaining', '0');
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Daily rate limit exceeded', status: 429 } },
        429
      );
    }

    // Increment counters
    await Promise.all([
      kv.put(minuteKey, String(minuteCount + 1), { expirationTtl: 120 }),
      kv.put(dayKey, String(dayCount + 1), { expirationTtl: 86400 }),
    ]);

    c.header('X-RateLimit-Limit', String(apiKey.rateLimitRpm));
    c.header('X-RateLimit-Remaining', String(apiKey.rateLimitRpm - minuteCount - 1));

    await next();
  };
};
