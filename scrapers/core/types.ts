/**
 * 黑客松爬虫系统 - 类型定义
 */

export type Organizer = {
  name: string;
  logo?: string;
};

export type Sponsor = {
  name: string;
  logo?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
};

export interface Hackathon {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  venue: string;
  dateRange: string;
  isPast: boolean;
  status: "upcoming" | "live" | "closed";
  summary: string;
  prizePool: string;
  teams: string;
  format: "offline" | "online" | "hybrid";
  theme: string;
  website: string;
  brief: string;
  tracks: { title: string; description: string }[];
  agenda: { title: string; time: string; detail: string }[];
  organizers?: Organizer[];
  sponsors?: Sponsor[];
}

/**
 * 草稿箱数据（待审核）
 */
export interface DraftHackathon extends Omit<Partial<Hackathon>, 'status'> {
  draftId: string;
  source: string; // URL 或 "manual"
  createdAt: string;
  draftStatus: "pending" | "approved" | "rejected";
  rawData?: any; // 原始爬取数据
  confidence?: number; // AI 解析置信度 0-1
}

/**
 * 爬取结果
 */
export interface ScrapeResult {
  success: boolean;
  data?: Partial<Hackathon>;
  rawHtml?: string;
  error?: string;
  confidence: number;
  platform?: string; // 识别的平台类型
}

/**
 * 文本解析结果
 */
export interface ParseResult {
  success: boolean;
  data?: Partial<Hackathon>;
  error?: string;
  confidence: number;
  suggestions?: string[]; // 改进建议
}

/**
 * 支持的中国黑客松平台
 */
export enum ChinesePlatform {
  DORAHACKS = "dorahacks.cn",
  JUEJIN = "juejin.cn",
  NOWCODER = "nowcoder.com",
  HUODONGXING = "huodongxing.com",
  HUDONGBA = "hudongba.com",
  GENERIC = "generic" // 通用爬取器
}
