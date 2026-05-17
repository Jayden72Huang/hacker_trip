export interface Env {
  DATABASE_URL: string;
  API_MASTER_KEY: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_KV: KVNamespace;
}

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}
