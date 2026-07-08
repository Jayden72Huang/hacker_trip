import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DEAD_LINK_NAMES = [
  'AttraX 春潮 Spring 深圳黑客松',
  'BEYOND HACK DAY 澳门',
  'Agent Economy on Bitcoin (GOAT Hackathon)',
  'Moonshot Universe 黑客松',
  'Mantle 2026 图灵测试黑客松',
  '蚂蚁集团·第十一届黑客松',
];

async function main() {
  const all = await db.select({
    id: hackathons.id,
    name: hackathons.name,
    slug: hackathons.slug,
    prizePool: hackathons.prizePool,
    theme: hackathons.theme,
    teams: hackathons.teams,
    tracks: hackathons.tracks,
    summary: hackathons.summary,
    website: hackathons.website,
    status: hackathons.status,
  }).from(hackathons);

  console.log(`Total hackathons: ${all.length}\n`);

  let deadCount = 0;
  for (const h of all) {
    if (DEAD_LINK_NAMES.some(n => h.name.includes(n) || n.includes(h.name))) {
      console.log(`[DEAD LINK] "${h.name}" → ended`);
      await db.update(hackathons).set({ status: 'ended' }).where(eq(hackathons.id, h.id));
      deadCount++;
    }
  }
  console.log(`\nMarked ${deadCount} dead-link hackathons as ended\n`);

  const remaining = all.filter(h => !DEAD_LINK_NAMES.some(n => h.name.includes(n) || n.includes(h.name)));

  let poorCount = 0;
  for (const h of remaining) {
    if (h.status === 'ended') continue;

    const hasFields = [
      h.prizePool && h.prizePool.trim() !== '',
      h.theme && h.theme.trim() !== '',
      h.teams && h.teams.trim() !== '',
      Array.isArray(h.tracks) && (h.tracks as unknown[]).length > 0,
    ];
    const fieldCount = hasFields.filter(Boolean).length;

    if (fieldCount < 1) {
      console.log(`[POOR] "${h.name}" (${h.slug}) → ended (0/4 key fields)`);
      await db.update(hackathons).set({ status: 'ended' }).where(eq(hackathons.id, h.id));
      poorCount++;
    } else {
      console.log(`[OK] "${h.name}" — ${fieldCount}/4 fields`);
    }
  }
  console.log(`\nMarked ${poorCount} poor-data hackathons as ended`);

  const finalUpcoming = await db.select({ name: hackathons.name, status: hackathons.status })
    .from(hackathons)
    .where(eq(hackathons.status, 'upcoming'));
  console.log(`\n=== Remaining upcoming: ${finalUpcoming.length} ===`);
  finalUpcoming.forEach(h => console.log(`  ✅ ${h.name}`));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
