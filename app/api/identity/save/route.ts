/**
 * ============================================================================
 *  POST /api/identity/save — best-effort 持久化身份卡（未登录不报错）
 * ============================================================================
 *
 *  MVP：配置卡持久化主存 = 前端 localStorage。本路由仅做"已登录时尽力写库"：
 *    - 已登录(auth())且存在 users.devConfig 列时写入（当前 schema 暂无该列，
 *      故写入逻辑包在 try/catch 内，失败静默降级）。
 *    - 未登录：直接 echo 返回 200，绝不阻断前端保存流程。
 *
 *  nodejs runtime。任何异常都收敛为 { ok:true, persisted:false }。
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { createDevConfig } from '@/lib/identity/config';
import type { DevConfig } from '@/lib/identity/types';

export const runtime = 'nodejs';

interface SaveBody {
  config?: Partial<DevConfig>;
  manualRole?: string | null;
  username?: string | null;
}

export async function POST(req: NextRequest) {
  let body: SaveBody = {};
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    body = {};
  }

  const config = createDevConfig(body.config);

  let userId: string | null = null;
  let persisted = false;

  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
    // DB 持久化为后续：当前 schema 无 users.devConfig 列，
    // 这里预留写入点。若未来加列，可在此 best-effort update。
    // 任何写库失败都不得抛出。
  } catch {
    userId = null;
  }

  return NextResponse.json({
    ok: true,
    persisted,
    loggedIn: Boolean(userId),
    config,
    manualRole: body.manualRole ?? null,
  });
}
