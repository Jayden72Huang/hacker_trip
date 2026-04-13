/**
 * Hackathon Recommendation Engine
 *
 * Scores upcoming hackathons for a user based on:
 * - Skill match (Jaccard similarity, 0-40 pts)
 * - Interest/track match (overlap, 0-30 pts)
 * - History boost (similar past participations, 0-20 pts)
 * - Freshness (prefer newer hackathons, 0-10 pts)
 */

import { db } from '@/lib/db';
import {
  users,
  hackathons,
  participations,
  recommendations,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// ─── Types ───

interface ScoredHackathon {
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
  matchedSkills: string[];
  matchedInterests: string[];
}

// ─── Scoring helpers ───

/** Jaccard similarity: |A ∩ B| / |A ∪ B| */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/** Overlap items between two arrays (case-insensitive) */
function findOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase()));
}

/** Safely cast jsonb to string[] */
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
  return [];
}

// ─── Main engine ───

export async function generateRecommendations(
  userId: string
): Promise<ScoredHackathon[]> {
  // 1. Load user profile
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .then((rows) => rows[0]);

  if (!user) throw new Error('User not found');

  const userSkills = toStringArray(user.skills);
  const userInterests = toStringArray(user.interests);
  const userTracks = toStringArray(user.preferredTracks);

  // 2. Load participation history
  const history = await db
    .select()
    .from(participations)
    .where(eq(participations.userId, userId));

  const pastHackathonIds = new Set(
    history.map((p) => p.hackathonId).filter(Boolean)
  );
  const pastTracks = history.map((p) => p.track).filter(Boolean) as string[];

  // 3. Query upcoming hackathons
  const upcomingHackathons = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.status, 'upcoming'))
    .orderBy(desc(hackathons.createdAt));

  if (upcomingHackathons.length === 0) return [];

  const now = Date.now();

  // 4. Score each hackathon
  const scored: ScoredHackathon[] = upcomingHackathons
    .filter((h) => !pastHackathonIds.has(h.id)) // exclude already joined
    .map((h) => {
      const hTechStack = toStringArray(h.techStack);
      const hTracks = toStringArray(h.tracks);
      const hTags = toStringArray(h.tags);
      const reasons: string[] = [];

      // Skill match: Jaccard similarity → 0-40 pts
      const skillSim = jaccardSimilarity(userSkills, hTechStack);
      const skillScore = Math.round(skillSim * 40);
      const matchedSkills = findOverlap(userSkills, hTechStack);
      if (matchedSkills.length > 0) {
        reasons.push(`技术栈匹配: ${matchedSkills.join(', ')}`);
      }

      // Interest/track match → 0-30 pts
      const allUserInterests = [...new Set([...userInterests, ...userTracks])];
      const allHackathonTopics = [...new Set([...hTracks, ...hTags])];
      const interestOverlap = findOverlap(allUserInterests, allHackathonTopics);
      const interestScore =
        allUserInterests.length === 0
          ? 0
          : Math.round(
              (interestOverlap.length /
                Math.max(allUserInterests.length, 1)) *
                30
            );
      if (interestOverlap.length > 0) {
        reasons.push(`兴趣匹配: ${interestOverlap.join(', ')}`);
      }

      // History boost: if similar tracks from past participations → 0-20 pts
      const trackOverlapWithHistory = findOverlap(pastTracks, hTracks);
      const historyScore =
        pastTracks.length === 0
          ? 0
          : Math.min(
              Math.round(
                (trackOverlapWithHistory.length /
                  Math.max(pastTracks.length, 1)) *
                  20
              ),
              20
            );
      if (trackOverlapWithHistory.length > 0) {
        reasons.push(
          `你曾参加过类似赛道: ${trackOverlapWithHistory.join(', ')}`
        );
      }

      // Freshness: newer hackathons get more points → 0-10 pts
      const createdMs = h.createdAt ? h.createdAt.getTime() : 0;
      const ageInDays = Math.max(0, (now - createdMs) / (1000 * 60 * 60 * 24));
      const freshnessScore = Math.max(0, Math.round(10 - ageInDays * 0.1));

      if (freshnessScore >= 7) {
        reasons.push('新发布的比赛');
      }

      const totalScore =
        skillScore + interestScore + historyScore + freshnessScore;

      if (reasons.length === 0) {
        reasons.push('推荐浏览');
      }

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
        score: totalScore,
        reasons,
        matchedSkills,
        matchedInterests: interestOverlap,
      };
    });

  // 5. Sort by score descending and take top 10
  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  // 6. Save to recommendations table (delete old ones first)
  if (top10.length > 0) {
    // Clear previous recommendations for this user
    await db
      .delete(recommendations)
      .where(eq(recommendations.userId, userId));

    // Insert new recommendations
    await db.insert(recommendations).values(
      top10.map((r) => ({
        userId,
        hackathonId: r.hackathonId,
        score: r.score,
        reasons: r.reasons,
        matchedSkills: r.matchedSkills,
        matchedInterests: r.matchedInterests,
      }))
    );
  }

  return top10;
}
