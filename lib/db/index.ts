import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// 构建时（如 Vercel）可能没有 DATABASE_URL，用占位串避免 neon() 抛错；运行时需在环境变量中配置真实连接串
const connectionString =
  process.env.DATABASE_URL || 'postgresql://build:build@localhost/build';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
