import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateProjectRecommendations } from '@/lib/recommendations/project-engine';
import { notifyProjectRecommendation } from '@/lib/notifications';
import { handleRouteError } from '@/lib/api/route-helpers';

export async function POST(
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
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const recommendations = await generateProjectRecommendations(id);

    if (recommendations.length > 0) {
      const top = recommendations[0];
      try {
        await notifyProjectRecommendation(
          session.user.id,
          project.name,
          top.hackathon.name,
          top.hackathonId,
          top.matchedTechStack,
        );
      } catch (error) {
        console.error('Project recommendation notification failed:', error);
      }
    }

    return NextResponse.json({ data: recommendations, meta: { count: recommendations.length } });
  } catch (error) {
    return handleRouteError(error, 'Generate project recommendations failed');
  }
}
