import { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export const cors = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    // Public API: allow any origin (auth via API key)
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400');

    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }

    await next();
  };
};
