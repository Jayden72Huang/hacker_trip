import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectRecommendations, hackathons, projects } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { handleRouteError } from '@/lib/api/route-helpers';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = await db
      .select({
        id: projectRecommendations.id,
        score: projectRecommendations.score,
        reasons: projectRecommendations.reasons,
        matchedTechStack: projectRecommendations.matchedTechStack,
        matchedTracks: projectRecommendations.matchedTracks,
        isViewed: projectRecommendations.isViewed,
        createdAt: projectRecommendations.createdAt,
        hackathon: {
          id: hackathons.id,
          name: hackathons.name,
          slug: hackathons.slug,
          description: hackathons.description,
          startDate: hackathons.startDate,
          endDate: hackathons.endDate,
          tracks: hackathons.tracks,
          techStack: hackathons.techStack,
          prizePool: hackathons.prizePool,
          mode: hackathons.mode,
          location: hackathons.location,
          logo: hackathons.logo,
          website: hackathons.website,
        },
      })
      .from(projectRecommendations)
      .innerJoin(hackathons, eq(hackathons.id, projectRecommendations.hackathonId))
      .where(eq(projectRecommendations.projectId, id))
      .orderBy(desc(projectRecommendations.score));

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error, 'Get project recommendations failed');
  }
}
