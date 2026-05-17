/**
 * Project-to-hackathon recommendation engine.
 *
 * Scores upcoming hackathons for a project based on:
 * - Tech stack match (Jaccard similarity, 0-50 pts)
 * - Track match (overlap, 0-30 pts)
 * - Freshness (newer hackathons, 0-10 pts)
 * - Prize bonus (0-10 pts)
 */

import { db } from '@/lib/db';
import { projects, hackathons, projectRecommendations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  findOverlap,
  jaccardSimilarity,
  toStringArray,
} from '@/lib/recommendations/engine';

export interface ScoredProjectHackathon {
  hackathonId: string;
  hackathon: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    tracks: string[];
    tags: string[];
    techStack: string[];
    prizePool: string | null;
    mode: string | null;
    location: string | null;
    logo: string | null;
    website: string | null;
  };
  score: number;
  reasons: string[];
  matchedTechStack: string[];
  matchedTracks: string[];
}

export async function generateProjectRecommendations(
  projectId: string
): Promise<ScoredProjectHackathon[]> {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .then((rows) => rows[0]);

  if (!project) throw new Error('Project not found');

  const projectTechStack = toStringArray(project.techStack);
  const projectTracks = toStringArray(project.tracks);

  const upcomingHackathons = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.status, 'upcoming'))
    .orderBy(desc(hackathons.createdAt));

  const now = Date.now();

  const scored: ScoredProjectHackathon[] = upcomingHackathons.map((h) => {
    const hTechStack = toStringArray(h.techStack);
    const hTracks = toStringArray(h.tracks);
    const hTags = toStringArray(h.tags);
    const reasons: string[] = [];

    const techSimilarity = jaccardSimilarity(projectTechStack, hTechStack);
    const techStackScore = Math.round(techSimilarity * 50);
    const matchedTechStack = findOverlap(projectTechStack, hTechStack);
    if (matchedTechStack.length > 0) {
      reasons.push(`技术栈匹配: ${matchedTechStack.join(', ')}`);
    }

    const matchedTracks = findOverlap(projectTracks, hTracks);
    const trackScore =
      projectTracks.length === 0
        ? 0
        : Math.min(
            Math.round((matchedTracks.length / projectTracks.length) * 30),
            30
          );
    if (matchedTracks.length > 0) {
      reasons.push(`赛道匹配: ${matchedTracks.join(', ')}`);
    }

    const ageInDays = h.createdAt
      ? Math.max(0, (now - h.createdAt.getTime()) / 86400000)
      : Number.POSITIVE_INFINITY;
    const freshnessScore = Math.min(
      10,
      Math.max(0, Math.round(10 - ageInDays * 0.1))
    );
    if (freshnessScore >= 7) {
      reasons.push('新发布的比赛');
    }

    const hasPrizePool = Boolean(h.prizePool?.trim());
    const prizeScore = hasPrizePool ? 10 : 0;
    if (hasPrizePool) {
      reasons.push('有奖金池');
    }

    const score = techStackScore + trackScore + freshnessScore + prizeScore;

    return {
      hackathonId: h.id,
      hackathon: {
        id: h.id,
        name: h.name,
        slug: h.slug,
        description: h.description,
        startDate: h.startDate,
        endDate: h.endDate,
        tracks: hTracks,
        tags: hTags,
        techStack: hTechStack,
        prizePool: h.prizePool,
        mode: h.mode,
        location: h.location,
        logo: h.logo,
        website: h.website,
      },
      score,
      reasons,
      matchedTechStack,
      matchedTracks,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  await db.transaction(async (tx) => {
    await tx
      .delete(projectRecommendations)
      .where(eq(projectRecommendations.projectId, projectId));

    if (top10.length > 0) {
      await tx
        .insert(projectRecommendations)
        .values(
          top10.map((r) => ({
            projectId,
            hackathonId: r.hackathonId,
            score: r.score,
            reasons: r.reasons,
            matchedTechStack: r.matchedTechStack,
            matchedTracks: r.matchedTracks,
          }))
        )
        .onConflictDoNothing({
          target: [
            projectRecommendations.projectId,
            projectRecommendations.hackathonId,
          ],
        });
    }
  });

  return top10;
}
