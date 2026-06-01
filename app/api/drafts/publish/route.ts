import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { draftHackathons, hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdmin } from '@/lib/auth-helpers';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `hackathon-${Date.now()}`;
}

// 资讯/门户类域名：这些不是报名入口，仅是新闻或机构首页，不应作为黑客松的报名链接
const LOW_QUALITY_LINK_HOSTS = [
  'segmentfault.com', 'coinworldnet.com', 'benzinga.com',
  'people.com.cn', 'hf365.com', 'sohu.com', '163.com', 'sina.com.cn',
  '36kr.com', 'xueqiu.com', 'jianshu.com', 'zhihu.com', 'baijiahao.baidu.com',
];
const LOW_QUALITY_LINK_PATTERNS = [/\.gov\.cn$/i];

function isLowQualityLink(raw: string): boolean {
  let host = '';
  try { host = new URL(raw).hostname.toLowerCase(); } catch { return false; }
  if (LOW_QUALITY_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  return LOW_QUALITY_LINK_PATTERNS.some((re) => re.test(host));
}

// 上架完整度校验：缺主题/赛道、或报名链接不是有效入口，都拦截。返回缺失项列表，空数组表示通过。
function validateHackathonQuality(draft: {
  theme?: string | null;
  tracks?: unknown;
  sourceUrl?: string | null;
}): string[] {
  const missing: string[] = [];
  if (!draft.theme || !draft.theme.trim()) missing.push('主题（theme）');
  const trackCount = Array.isArray(draft.tracks) ? draft.tracks.length : 0;
  if (trackCount === 0) missing.push('至少一个赛道（tracks）');
  const url = (draft.sourceUrl || '').trim();
  if (!url) {
    missing.push('报名/官网链接');
  } else if (isLowQualityLink(url)) {
    missing.push('有效报名链接（当前是资讯/政府门户页，不是报名入口）');
  }
  return missing;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdmin();
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: '缺少 draftId' }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(draftHackathons)
      .where(eq(draftHackathons.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
    }

    if (!draft.name || !draft.startDate || !draft.endDate) {
      return NextResponse.json(
        { error: '缺少必要字段：名称、开始日期、结束日期' },
        { status: 400 }
      );
    }

    // 完整度门槛：信息不全的草稿不允许上架，避免再次混入空数据
    const missing = validateHackathonQuality(draft);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `信息不完整，无法上架，请先补全：${missing.join('、')}`,
          code: 'incomplete',
          missing,
        },
        { status: 422 }
      );
    }

    const location = [draft.city, draft.venue].filter(Boolean).join(' · ');
    const hostOrganizer = Array.isArray(draft.organizers) && draft.organizers.length > 0
      ? (draft.organizers as { name: string }[])[0].name
      : undefined;

    let hackathon;

    if (draft.publishedHackathonId) {
      // Re-publish: update existing hackathon
      const [updated] = await db
        .update(hackathons)
        .set({
          name: draft.name,
          shortName: draft.shortName,
          description: draft.summary,
          summary: draft.summary,
          website: draft.sourceUrl,
          sourceUrl: draft.sourceUrl,
          startDate: draft.startDate,
          endDate: draft.endDate,
          mode: (draft.format as 'offline' | 'online' | 'hybrid') || 'hybrid',
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
        })
        .where(eq(hackathons.id, draft.publishedHackathonId))
        .returning();
      hackathon = updated;
    } else {
      // First publish: create new hackathon
      const baseSlug = generateSlug(draft.shortName || draft.name);
      let slug = baseSlug;
      let attempt = 0;
      while (true) {
        const existing = await db
          .select({ id: hackathons.id })
          .from(hackathons)
          .where(eq(hackathons.slug, slug))
          .limit(1);
        if (existing.length === 0) break;
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      const [created] = await db
        .insert(hackathons)
        .values({
          name: draft.name,
          slug,
          shortName: draft.shortName,
          description: draft.summary,
          summary: draft.summary,
          website: draft.sourceUrl,
          sourceUrl: draft.sourceUrl,
          startDate: draft.startDate,
          endDate: draft.endDate,
          mode: (draft.format as 'offline' | 'online' | 'hybrid') || 'hybrid',
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
          status: 'upcoming',
          isVerified: false,
          isFeatured: false,
          createdBy: draft.createdBy,
        })
        .returning();
      hackathon = created;
    }

    await db
      .update(draftHackathons)
      .set({
        status: 'published',
        publishedHackathonId: hackathon.id,
        publishedAt: new Date(),
      })
      .where(eq(draftHackathons.id, draftId));

    const action = draft.publishedHackathonId ? '更新' : '发布';
    return NextResponse.json({
      success: true,
      action,
      hackathon: {
        id: hackathon.id,
        name: hackathon.name,
        slug: hackathon.slug,
      },
    });
  } catch (error) {
    console.error('Publish draft error:', error);
    return NextResponse.json(
      { error: '发布失败，请稍后重试' },
      { status: 500 }
    );
  }
}
