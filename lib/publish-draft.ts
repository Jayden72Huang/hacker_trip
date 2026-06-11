/**
 * 将一条 draft_hackathon 发布为正式 hackathon（与 app/api/drafts/publish/route.ts 同款映射）。
 * 抽成共享函数，供发布 API、爬虫自动发布、批处理脚本复用。
 *
 * 传入任意 drizzle db 实例（neon-http 或 serverless 均可）。
 * 不做权限/完整度校验——调用方负责（API 用 validateHackathonQuality，爬虫用 qualifiesForAutoPublish）。
 */
import { eq } from 'drizzle-orm';
import { hackathons, draftHackathons } from './db/schema';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `hackathon-${Date.now()}`;
}

type DraftRow = typeof draftHackathons.$inferSelect;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;

export async function publishDraftRow(
  db: AnyDb,
  draft: DraftRow,
): Promise<{ id: string; slug: string; name: string; action: '发布' | '更新' }> {
  const location = [draft.city, draft.venue].filter(Boolean).join(' · ');
  const hostOrganizer = Array.isArray(draft.organizers) && draft.organizers.length > 0
    ? (draft.organizers as { name: string }[])[0].name
    : undefined;

  const mode = (draft.format as 'offline' | 'online' | 'hybrid') || 'hybrid';

  const shared = {
    name: draft.name!,
    shortName: draft.shortName,
    description: draft.summary,
    summary: draft.summary,
    website: draft.sourceUrl,
    sourceUrl: draft.sourceUrl,
    startDate: draft.startDate!,
    endDate: draft.endDate!,
    mode,
    location,
    city: draft.city,
    country: draft.country,
    venue: draft.venue,
    theme: draft.theme,
    prizePool: draft.prizePool,
    teams: draft.teams,
    tracks: draft.tracks,
    agenda: draft.agenda,
    organizers: draft.organizers,
    sponsors: draft.sponsors,
    hostOrganizer,
  };

  let hackathon: { id: string; slug: string; name: string };
  let action: '发布' | '更新';

  if (draft.publishedHackathonId) {
    const [updated] = await db
      .update(hackathons)
      .set(shared)
      .where(eq(hackathons.id, draft.publishedHackathonId))
      .returning();
    hackathon = updated;
    action = '更新';
  } else {
    const baseSlug = generateSlug(draft.shortName || draft.name!);
    let slug = baseSlug;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db
        .select({ id: hackathons.id })
        .from(hackathons)
        .where(eq(hackathons.slug, slug))
        .limit(1);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${++attempt}`;
    }
    const [created] = await db
      .insert(hackathons)
      .values({
        ...shared,
        slug,
        status: 'upcoming',
        isVerified: false,
        isFeatured: false,
        createdBy: draft.createdBy,
      })
      .returning();
    hackathon = created;
    action = '发布';
  }

  await db
    .update(draftHackathons)
    .set({ status: 'published', publishedHackathonId: hackathon.id, publishedAt: new Date() })
    .where(eq(draftHackathons.id, draft.id));

  return { id: hackathon.id, slug: hackathon.slug, name: hackathon.name, action };
}
