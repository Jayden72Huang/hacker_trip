/**
 * ============================================================================
 *  HackerTrip — 身份卡分享编解码 (本地裂变闭环桥接)
 * ============================================================================
 *
 *  自建卡（IdentityWizard，source:'local'）尚未做 DB 持久化、没有真实
 *  username。为了让“分享我的卡 → 别人打开看到我的卡”在本地无后端时也能
 *  完整跑通，把整张卡的数据编码进分享 URL 的 ?c=<payload> 参数：
 *    - /u/<name>?c=<payload>         落地页解码后渲染用户真实的卡
 *    - /api/identity/og?c=<payload>  og 图同样还原用户真实的卡
 *
 *  采用 UTF-8 安全的 url-safe base64，server(node/edge)/client 三端通用
 *  （TextEncoder / TextDecoder / btoa / atob 均为全局可用）。
 *
 *  ⚠️ 这是“无 DB 也能演示裂变”的桥接方案；生产环境应在保存时写库并分配
 *     短 id（/u/<username>），用短链替代长 payload。见 IDENTITY-DESIGN.md。
 * ============================================================================
 */

import type { IdentityCardData } from './types';

/** 分享 URL 内嵌卡数据的 query 参数名 */
export const SHARE_PARAM = 'c';

function toUrlSafeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** 把身份卡编码成 url-safe base64 payload */
export function encodeIdentity(data: IdentityCardData): string {
  return toUrlSafeBase64(JSON.stringify(data));
}

/**
 * 解码分享 payload → IdentityCardData。
 * 任何解析失败或结构不完整都返回 null（调用方据此回退 DB/mock）。
 */
export function decodeIdentity(
  param: string | null | undefined,
): IdentityCardData | null {
  if (!param) return null;
  try {
    const obj = JSON.parse(fromUrlSafeBase64(param)) as Partial<IdentityCardData>;
    if (
      !obj ||
      typeof obj !== 'object' ||
      !obj.role ||
      typeof obj.role.primary !== 'string' ||
      !obj.config ||
      !obj.stats ||
      !Array.isArray(obj.career)
    ) {
      return null;
    }
    return obj as IdentityCardData;
  } catch {
    return null;
  }
}
