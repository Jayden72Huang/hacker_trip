/**
 * 种子脚本：将 data/hackathons.ts 的 6 个硬编码活动迁移到数据库
 * 运行: npx tsx scripts/seed-hackathons.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hackathons as hackathonTable } from '../lib/db/schema';
import { hackathons as hackathonData } from '../data/hackathons';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

// "Jan 18–19" → { start: Date, end: Date } (年份 2026)
function parseDateRange(dateRange: string): { start: Date; end: Date } {
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})[–-](\d{1,2})/);
  if (!match) throw new Error(`Cannot parse dateRange: ${dateRange}`);
  const [, month, startDay, endDay] = match;
  const monthIndex = monthMap[month];
  return {
    start: new Date(2026, monthIndex, parseInt(startDay)),
    end: new Date(2026, monthIndex, parseInt(endDay)),
  };
}

// status 映射: UI → DB
function mapStatus(status: string): 'upcoming' | 'ongoing' | 'ended' {
  switch (status) {
    case 'closed': return 'ended';
    case 'live': return 'ongoing';
    default: return 'upcoming';
  }
}

async function seed() {
  console.log(`Seeding ${hackathonData.length} hackathons...`);

  for (const h of hackathonData) {
    const { start, end } = parseDateRange(h.dateRange);

    const values = {
      id: h.id,
      name: h.name,
      slug: h.id,
      description: h.summary,
      website: h.website,
      startDate: start,
      endDate: end,
      mode: h.format as 'online' | 'offline' | 'hybrid',
      location: `${h.venue}, ${h.city}`,
      prizePool: h.prizePool,
      organizer: h.hostOrganizer || (h.organizers?.[0]?.name ?? null),
      sponsors: h.sponsors || [],
      status: mapStatus(h.status),
      isFeatured: true,
      isVerified: true,
      // 新增字段
      shortName: h.shortName,
      city: h.city,
      country: h.country,
      venue: h.venue,
      theme: h.theme,
      summary: h.summary,
      teams: h.teams,
      brief: h.brief,
      hostOrganizer: h.hostOrganizer || null,
      agenda: h.agenda || [],
      registration: h.registration || null,
      infoCards: h.infoCards || null,
      organizers: h.organizers || [],
      tracks: h.tracks || [],
    };

    // INSERT ON CONFLICT UPDATE (idempotent)
    await db
      .insert(hackathonTable)
      .values(values)
      .onConflictDoUpdate({
        target: hackathonTable.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          website: sql`excluded.website`,
          startDate: sql`excluded.start_date`,
          endDate: sql`excluded.end_date`,
          mode: sql`excluded.mode`,
          location: sql`excluded.location`,
          prizePool: sql`excluded.prize_pool`,
          organizer: sql`excluded.organizer`,
          sponsors: sql`excluded.sponsors`,
          status: sql`excluded.status`,
          isFeatured: sql`excluded.is_featured`,
          isVerified: sql`excluded.is_verified`,
          shortName: sql`excluded.short_name`,
          city: sql`excluded.city`,
          country: sql`excluded.country`,
          venue: sql`excluded.venue`,
          theme: sql`excluded.theme`,
          summary: sql`excluded.summary`,
          teams: sql`excluded.teams`,
          brief: sql`excluded.brief`,
          hostOrganizer: sql`excluded.host_organizer`,
          agenda: sql`excluded.agenda`,
          registration: sql`excluded.registration`,
          infoCards: sql`excluded.info_cards`,
          organizers: sql`excluded.organizers`,
          tracks: sql`excluded.tracks`,
          updatedAt: sql`now()`,
        },
      });

    console.log(`  ✓ ${h.id} (${h.name})`);
  }

  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
