import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recommendations, hackathons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/recommendations — 获取当前用户的推荐列表
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const recs = await db
    .select({
      id: recommendations.id,
      hackathonId: recommendations.hackathonId,
      score: recommendations.score,
      reasons: recommendations.reasons,
      matchedSkills: recommendations.matchedSkills,
      matchedInterests: recommendations.matchedInterests,
      isViewed: recommendations.isViewed,
      isClicked: recommendations.isClicked,
      createdAt: recommendations.createdAt,
      hackathon: {
        id: hackathons.id,
        name: hackathons.name,
        slug: hackathons.slug,
        description: hackathons.description,
        startDate: hackathons.startDate,
        endDate: hackathons.endDate,
        tracks: hackathons.tracks,
        tags: hackathons.tags,
        techStack: hackathons.techStack,
        prizePool: hackathons.prizePool,
        mode: hackathons.mode,
        location: hackathons.location,
        logo: hackathons.logo,
        website: hackathons.website,
      },
    })
    .from(recommendations)
    .innerJoin(hackathons, eq(recommendations.hackathonId, hackathons.id))
    .where(eq(recommendations.userId, session.user.id))
    .orderBy(desc(recommendations.score));

  return NextResponse.json({ data: recs });
}
