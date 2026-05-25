/**
 * 导入脚本：从 hackathon-navigator.vercel.app 抓取的数据导入到 hackathons 表
 * 数据来源: .firecrawl/hackathon-navigator.md
 * 运行: npx tsx scripts/import-hackathon-navigator.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hackathons as hackathonTable } from '../lib/db/schema';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

interface ParsedHackathon {
  name: string;
  website: string;
  statusText: string;
  description: string;
  regDeadline: string;
  competitionTime: string;
  tags: string;
}

function parseMarkdown(content: string): ParsedHackathon[] {
  const results: ParsedHackathon[] = [];
  const lines = content.split('\n').filter(l => l.trim());

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // 匹配 [赛事名](url) 格式
    const linkMatch = line.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch && i + 1 < lines.length) {
      const name = linkMatch[1];
      const website = linkMatch[2];

      // 下一行是状态
      const statusText = (lines[i + 1] || '').trim();
      if (!['报名中', '即将截止', '待开放', '已截止'].includes(statusText)) {
        i++;
        continue;
      }

      // 描述
      const description = (lines[i + 2] || '').trim();
      // 报名截止
      const regDeadline = (lines[i + 3] || '').replace('报名截止', '').trim();
      // 比赛时间
      const competitionTime = (lines[i + 4] || '').replace('比赛时间', '').trim();
      // 标签行
      const tags = (lines[i + 5] || '').trim();

      results.push({ name, website, statusText, description, regDeadline, competitionTime, tags });
      i += 7; // 跳过 [查看详情] 链接行
    } else {
      i++;
    }
  }
  return results;
}

function mapStatus(statusText: string): 'upcoming' | 'ongoing' | 'ended' {
  switch (statusText) {
    case '报名中': return 'upcoming';
    case '即将截止': return 'upcoming';
    case '待开放': return 'upcoming';
    case '已截止': return 'ended';
    default: return 'upcoming';
  }
}

function mapMode(tags: string): 'online' | 'offline' | 'hybrid' {
  if (tags.includes('线上/全国') || tags.includes('线上')) return 'online';
  if (tags.includes('线下')) return 'offline';
  return 'hybrid';
}

function extractCity(tags: string): string {
  const regionCities: Record<string, string> = {
    '华东上海': '上海',
    '华东杭州': '杭州',
    '华东合肥': '合肥',
    '华东福州': '福州',
    '华东济南': '济南',
    '华东南京': '南京',
    '华北北京': '北京',
    '华北天津': '天津',
    '华北哈尔滨': '哈尔滨',
    '华南深圳': '深圳',
    '华中长沙': '长沙',
    '华中武汉': '武汉',
    '港澳台澳门': '澳门',
    '港澳台港澳': '港澳',
    '西部/东北昆明': '昆明',
    '西部/东北沈阳': '沈阳',
    '新加坡': '新加坡',
  };
  for (const [key, city] of Object.entries(regionCities)) {
    if (tags.startsWith(key)) return city;
  }
  if (tags.includes('线上/全国') || tags.includes('线上')) return '线上';
  if (tags.includes('多城市')) return '多城市';
  return '';
}

function extractCountry(tags: string): string {
  if (tags.includes('新加坡')) return '新加坡';
  return '中国';
}

function parseDate(timeStr: string): { start: Date; end: Date } {
  const now = new Date();
  const year = 2026;

  // "2026.06.21" 格式
  const exactMatch = timeStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (exactMatch) {
    const d = new Date(parseInt(exactMatch[1]), parseInt(exactMatch[2]) - 1, parseInt(exactMatch[3]));
    return { start: d, end: new Date(d.getTime() + 2 * 86400000) };
  }

  // "2026.05.10-11" 格式
  const rangeMatch = timeStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})-(\d{1,2})/);
  if (rangeMatch) {
    const s = new Date(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]) - 1, parseInt(rangeMatch[3]));
    const e = new Date(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]) - 1, parseInt(rangeMatch[4]));
    return { start: s, end: e };
  }

  // "2026.05.28-30" 格式
  const rangeMatch2 = timeStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})-(\d{1,2})/);
  if (rangeMatch2) {
    const s = new Date(parseInt(rangeMatch2[1]), parseInt(rangeMatch2[2]) - 1, parseInt(rangeMatch2[3]));
    const e = new Date(parseInt(rangeMatch2[1]), parseInt(rangeMatch2[2]) - 1, parseInt(rangeMatch2[4]));
    return { start: s, end: e };
  }

  // "2026.06-08（线上）" 格式 — 月份范围
  const monthRange = timeStr.match(/(\d{4})\.(\d{1,2})-(\d{1,2})/);
  if (monthRange) {
    const s = new Date(parseInt(monthRange[1]), parseInt(monthRange[2]) - 1, 1);
    const e = new Date(parseInt(monthRange[1]), parseInt(monthRange[3]) - 1 + 1, 0); // 月末
    return { start: s, end: e };
  }

  // "2026.07 总决赛" 格式 — 单月
  const monthMatch = timeStr.match(/(\d{4})\.(\d{1,2})/);
  if (monthMatch) {
    const s = new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1, 1);
    const e = new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]), 0); // 月末
    return { start: s, end: e };
  }

  // "预计2026年Q4" 格式
  const quarterMatch = timeStr.match(/(\d{4}).*Q(\d)/);
  if (quarterMatch) {
    const q = parseInt(quarterMatch[2]);
    const startMonth = (q - 1) * 3;
    const s = new Date(parseInt(quarterMatch[1]), startMonth, 1);
    const e = new Date(parseInt(quarterMatch[1]), startMonth + 3, 0);
    return { start: s, end: e };
  }

  // 长期
  if (timeStr.includes('长期')) {
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
  }

  // 默认用当前时间+30天
  return { start: now, end: new Date(now.getTime() + 30 * 86400000) };
}

function parseRegDeadline(regStr: string): Date | null {
  const match = regStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  const monthMatch = regStr.match(/(\d{4})\.(\d{1,2})/);
  if (monthMatch) {
    return new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]), 0);
  }
  return null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[（）()·×「」\[\]]/g, '-')
    .replace(/[^\w一-鿿-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function extractTagsArray(tags: string): string[] {
  return tags
    .split(/[/\s]/)
    .filter(t => t && !['线上', '线下', '全国'].includes(t))
    .slice(0, 5);
}

async function importData() {
  const filePath = join(process.cwd(), '.firecrawl/hackathon-navigator.md');
  const content = readFileSync(filePath, 'utf-8');
  const parsed = parseMarkdown(content);

  console.log(`解析到 ${parsed.length} 场赛事，开始导入...\n`);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const h of parsed) {
    try {
      const slug = toSlug(h.name);
      const { start, end } = parseDate(h.competitionTime);
      const regDeadline = parseRegDeadline(h.regDeadline);
      const city = extractCity(h.tags);
      const country = extractCountry(h.tags);
      const mode = mapMode(h.tags);
      const status = mapStatus(h.statusText);
      const tagsArray = extractTagsArray(h.tags);

      const location = city && city !== '线上'
        ? `${city}, ${country}`
        : (mode === 'online' ? '线上' : '');

      const values = {
        id: crypto.randomUUID(),
        name: h.name,
        slug: `hn-${slug}`,
        description: h.description,
        website: h.website,
        startDate: start,
        endDate: end,
        registrationDeadline: regDeadline,
        mode,
        location,
        city,
        country,
        status,
        tags: tagsArray,
        sourceUrl: 'https://hackathon-navigator.vercel.app/',
        isVerified: false,
        isFeatured: false,
        summary: h.description,
      };

      await db
        .insert(hackathonTable)
        .values(values)
        .onConflictDoUpdate({
          target: hackathonTable.slug,
          set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            website: sql`excluded.website`,
            startDate: sql`excluded.start_date`,
            endDate: sql`excluded.end_date`,
            registrationDeadline: sql`excluded.registration_deadline`,
            mode: sql`excluded.mode`,
            location: sql`excluded.location`,
            city: sql`excluded.city`,
            country: sql`excluded.country`,
            status: sql`excluded.status`,
            tags: sql`excluded.tags`,
            sourceUrl: sql`excluded.source_url`,
            summary: sql`excluded.summary`,
            updatedAt: sql`now()`,
          },
        });

      console.log(`  ✓ ${h.name} (${status}, ${city || '线上'})`);
      imported++;
    } catch (err: any) {
      console.log(`  ✗ ${h.name}: ${err.message}`);
      errors.push(`${h.name}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n导入完成！成功 ${imported} 条，跳过 ${skipped} 条`);
  if (errors.length > 0) {
    console.log('\n错误详情：');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

importData().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
