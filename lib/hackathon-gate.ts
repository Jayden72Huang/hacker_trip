/**
 * 黑客松上架门禁：已结束判断 + 报名链接验证 + 自动发布资格
 * 供 daily-crawl 爬虫、草稿清理脚本、（未来）发布 API 复用
 */
import { execSync } from 'child_process';
import { parseDateRange } from './normalize-hackathon';

// 名字里出现这些词，视为已结束/往届，不应进草稿箱
const ENDED_NAME_RE = /已结束|已截止|已收官|已圆满|往届|第\s*\d+\s*届\s*回顾/;

// 资讯/门户类域名：不是报名入口（与 app/api/drafts/publish/route.ts 保持一致）
const LOW_QUALITY_LINK_HOSTS = [
  'segmentfault.com', 'coinworldnet.com', 'benzinga.com',
  'people.com.cn', 'hf365.com', 'sohu.com', '163.com', 'sina.com.cn',
  '36kr.com', 'xueqiu.com', 'jianshu.com', 'zhihu.com', 'baijiahao.baidu.com',
];

/**
 * 判断一个赛事是否已结束。
 * 依据优先级：名字含已结束词 > 显式 endDate > 从 dateRange 文本解析的结束日。
 * 解析不出任何结束日期时返回 false（交给人工，不误杀）。
 */
export function isEndedHackathon(
  input: { name?: string | null; endDate?: Date | string | null; dateRange?: string | null },
  now: Date = new Date(),
): boolean {
  if (input.name && ENDED_NAME_RE.test(input.name)) return true;

  let end: Date | null = null;
  if (input.endDate) {
    end = input.endDate instanceof Date ? input.endDate : new Date(input.endDate);
  } else if (input.dateRange) {
    end = parseDateRange(input.dateRange).end;
  }
  if (!end || isNaN(end.getTime())) return false;

  // 用当天 0 点比较：结束日当天仍算进行中，次日才算结束
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endDay < today;
}

function hostOf(raw: string): string | null {
  try { return new URL(raw).hostname.toLowerCase(); } catch { return null; }
}

function isLowQualityHost(host: string): boolean {
  if (LOW_QUALITY_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  return /\.gov\.cn$/i.test(host);
}

/**
 * 验证报名链接：HTTP 可达（200-399）且不是资讯/门户/搜索页。
 * 用 curl 跟随重定向，10s 超时。失败一律返回 false（宁可不自动发布）。
 */
export function verifyRegistrationLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = hostOf(url);
  if (!host || isLowQualityHost(host)) return false;

  try {
    const cmd = `curl -sI -L --max-time 10 -o /dev/null -w '%{http_code}\\n%{url_effective}' '${url.replace(/'/g, "'\\''")}'`;
    const out = execSync(cmd, { timeout: 15000, encoding: 'utf-8' }).trim().split('\n');
    const code = parseInt(out[0], 10);
    const finalUrl = (out[1] || url).toLowerCase();
    if (isNaN(code) || code < 200 || code >= 400) return false;
    // 跳转到搜索/通用错误页则不算有效报名入口
    if (/google\.com\/search|bing\.com\/search|baidu\.com\/s|\/404|\/not-found|page not found|domain for sale|parked domain/.test(finalUrl)) {
      return false;
    }
    const finalHost = hostOf(finalUrl);
    if (finalHost && isLowQualityHost(finalHost)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 自动发布资格：未结束 + 置信度高 + 有主题 + 至少一个赛道 + 报名链接验证通过。
 * 注意：verifyRegistrationLink 会发网络请求，调用方应只对 conf 达标的草稿调用以省开销。
 */
export const AUTO_PUBLISH_MIN_CONFIDENCE = 90;

export function qualifiesForAutoPublish(draft: {
  name?: string | null;
  confidence?: number | null;
  theme?: string | null;
  tracks?: unknown;
  endDate?: Date | string | null;
  dateRange?: string | null;
  sourceUrl?: string | null;
}): boolean {
  if ((draft.confidence ?? 0) <= AUTO_PUBLISH_MIN_CONFIDENCE) return false;
  if (!draft.theme || !draft.theme.trim()) return false;
  if (!Array.isArray(draft.tracks) || draft.tracks.length === 0) return false;
  if (isEndedHackathon({ name: draft.name, endDate: draft.endDate, dateRange: draft.dateRange })) return false;
  return verifyRegistrationLink(draft.sourceUrl);
}
