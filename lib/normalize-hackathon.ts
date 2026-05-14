/**
 * 统一字段映射：将任意来源的 hackathon 数据标准化为 draft DB schema
 */

interface RawHackathonData {
  name?: string;
  shortName?: string;
  city?: string;
  country?: string;
  venue?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  format?: string;
  mode?: string;
  theme?: string;
  summary?: string;
  prizePool?: string;
  teams?: string;
  website?: string;
  source?: string;
  hostOrganizer?: string;
  tracks?: { title: string; description?: string }[];
  agenda?: { title: string; time?: string; detail?: string }[];
  organizers?: { name: string }[];
  sponsors?: { name: string; tier?: string }[];
  tags?: string[];
  [key: string]: unknown;
}

interface ImportMeta {
  url: string;
  platform?: string;
  confidence?: number;
}

export interface NormalizedDraft {
  sourceUrl: string;
  platform: string;
  name: string | null;
  shortName: string | null;
  city: string | null;
  country: string;
  venue: string | null;
  dateRange: string | null;
  startDate: Date | null;
  endDate: Date | null;
  format: string | null;
  theme: string | null;
  summary: string | null;
  prizePool: string | null;
  teams: string | null;
  tracks: { title: string; description?: string }[];
  agenda: { title: string; time?: string; detail?: string }[];
  organizers: { name: string }[];
  sponsors: { name: string; tier?: string }[];
  confidence: number | null;
  rawData: unknown;
  status: string;
}

export function normalizeToDraftInsert(
  data: RawHackathonData,
  meta: ImportMeta
): NormalizedDraft {
  const format = normalizeFormat(data.format || data.mode);

  // 合并 hostOrganizer 到 organizers
  let organizers = Array.isArray(data.organizers) ? [...data.organizers] : [];
  if (data.hostOrganizer && !organizers.some((o) => o.name === data.hostOrganizer)) {
    organizers.unshift({ name: data.hostOrganizer });
  }

  // 解析日期
  const dateRange = data.dateRange || null;
  let startDate = parseDate(data.startDate);
  let endDate = parseDate(data.endDate);

  if (!startDate && !endDate && dateRange) {
    const parsed = parseDateRange(dateRange);
    startDate = parsed.start;
    endDate = parsed.end;
  }

  // 置信度归一化为 0-100 整数
  let confidence: number | null = null;
  if (meta.confidence != null) {
    confidence =
      meta.confidence <= 1
        ? Math.round(meta.confidence * 100)
        : Math.round(meta.confidence);
  }

  return {
    sourceUrl: meta.url || data.website || data.source || '',
    platform: meta.platform || 'manual',
    name: data.name || null,
    shortName: data.shortName || generateShortName(data.name || ''),
    city: data.city || null,
    country: data.country || '中国',
    venue: data.venue || null,
    dateRange,
    startDate,
    endDate,
    format,
    theme: data.theme || null,
    summary: data.summary || null,
    prizePool: data.prizePool || null,
    teams: data.teams || null,
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
    agenda: Array.isArray(data.agenda) ? data.agenda : [],
    organizers,
    sponsors: Array.isArray(data.sponsors) ? data.sponsors : [],
    confidence,
    rawData: data,
    status: 'pending',
  };
}

function normalizeFormat(raw?: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (['offline', '线下'].includes(lower)) return 'offline';
  if (['online', '线上'].includes(lower)) return 'online';
  if (['hybrid', '混合'].includes(lower)) return 'hybrid';
  return lower;
}

function parseDate(val?: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 解析中文日期范围字符串为 start/end Date
 *
 * 支持格式:
 * - "2026年5月10日-11日"
 * - "2026年5月10-11日"
 * - "2026.5.10-5.11"
 * - "5月10日-5月12日" (默认当年)
 * - "2026-05-10 ~ 2026-05-11"
 * - "2026/05/10-2026/05/12"
 */
function parseDateRange(text: string): { start: Date | null; end: Date | null } {
  const fallback = { start: null, end: null };
  if (!text) return fallback;

  const currentYear = new Date().getFullYear();

  // ISO 格式: 2026-05-10 ~ 2026-05-11 or 2026-05-10 - 2026-05-11
  const isoMatch = text.match(
    /(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s*[~\-–—至到]\s*(\d{4})[/-](\d{1,2})[/-](\d{1,2})/
  );
  if (isoMatch) {
    return {
      start: new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]),
      end: new Date(+isoMatch[4], +isoMatch[5] - 1, +isoMatch[6]),
    };
  }

  // 中文格式: 2026年5月10日-11日 or 2026年5月10日-5月11日
  const zhMatch = text.match(
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?\s*[~\-–—至到]\s*(?:(\d{1,2})\s*月\s*)?(\d{1,2})\s*日?/
  );
  if (zhMatch) {
    const year = +zhMatch[1];
    const startMonth = +zhMatch[2];
    const startDay = +zhMatch[3];
    const endMonth = zhMatch[4] ? +zhMatch[4] : startMonth;
    const endDay = +zhMatch[5];
    return {
      start: new Date(year, startMonth - 1, startDay),
      end: new Date(year, endMonth - 1, endDay),
    };
  }

  // 无年份中文: 5月10日-5月12日 or 5月10日-12日
  const zhNoYear = text.match(
    /(\d{1,2})\s*月\s*(\d{1,2})\s*日?\s*[~\-–—至到]\s*(?:(\d{1,2})\s*月\s*)?(\d{1,2})\s*日?/
  );
  if (zhNoYear) {
    const startMonth = +zhNoYear[1];
    const startDay = +zhNoYear[2];
    const endMonth = zhNoYear[3] ? +zhNoYear[3] : startMonth;
    const endDay = +zhNoYear[4];
    return {
      start: new Date(currentYear, startMonth - 1, startDay),
      end: new Date(currentYear, endMonth - 1, endDay),
    };
  }

  // 点分格式: 2026.5.10-5.11 or 5.10-5.11
  const dotMatch = text.match(
    /(?:(\d{4})\s*[.]\s*)?(\d{1,2})\s*[.]\s*(\d{1,2})\s*[~\-–—至到]\s*(?:(\d{1,2})\s*[.]\s*)?(\d{1,2})/
  );
  if (dotMatch) {
    const year = dotMatch[1] ? +dotMatch[1] : currentYear;
    const startMonth = +dotMatch[2];
    const startDay = +dotMatch[3];
    const endMonth = dotMatch[4] ? +dotMatch[4] : startMonth;
    const endDay = +dotMatch[5];
    return {
      start: new Date(year, startMonth - 1, startDay),
      end: new Date(year, endMonth - 1, endDay),
    };
  }

  return fallback;
}

function generateShortName(name: string): string | null {
  if (!name) return null;
  let short = name
    .replace(/黑客松|hackathon|大赛|竞赛|编程马拉松/gi, '')
    .trim();
  if (short.length > 15) short = short.slice(0, 15);
  return short || name.slice(0, 10);
}
