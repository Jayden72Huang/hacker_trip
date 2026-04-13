import { Hono } from 'hono';
import type { Env } from './types/env';
import { cors } from './middleware/cors';
import { apiKeyAuth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';
import hackathonsRoutes from './routes/v1/hackathons';
import worksRoutes from './routes/v1/works';
import statsRoutes from './routes/v1/stats';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors());

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', version: c.env.API_VERSION });
});

// API v1 routes (require API key)
const v1 = new Hono<{ Bindings: Env }>();
v1.use('*', apiKeyAuth());
v1.use('*', rateLimit());
v1.route('/hackathons', hackathonsRoutes);
v1.route('/works', worksRoutes);
v1.route('/stats', statsRoutes);

app.route('/v1', v1);

// MCP endpoint placeholder (will be implemented in Phase 3)
app.all('/mcp', (c) => {
  return c.json({ error: { code: 'NOT_IMPLEMENTED', message: 'MCP server coming soon', status: 501 } }, 501);
});

// 404 fallback
app.all('*', (c) => {
  return c.json(
    { error: { code: 'NOT_FOUND', message: 'Endpoint not found', status: 404 } },
    404
  );
});

export default app;
