import { eq, desc, sql } from 'drizzle-orm';
import { type Database, schema } from '../db/client';

// ============ Resource Definitions ============

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resourceDefinitions: ResourceDefinition[] = [
  {
    uri: 'hackertrip://hackathons/upcoming',
    name: 'Upcoming Hackathons',
    description: 'List of upcoming hackathons on HackerTrip',
    mimeType: 'application/json',
  },
  {
    uri: 'hackertrip://hackathons/trending',
    name: 'Trending Hackathons',
    description: 'Top 10 hackathons by participant count',
    mimeType: 'application/json',
  },
  {
    uri: 'hackertrip://works/recent',
    name: 'Recent Verified Works',
    description: '10 most recently verified works on HackerTrip',
    mimeType: 'application/json',
  },
  {
    uri: 'hackertrip://stats',
    name: 'Platform Statistics',
    description: 'Overall HackerTrip platform statistics',
    mimeType: 'application/json',
  },
];

// ============ Resource Readers ============

interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

interface ResourceResult {
  contents: ResourceContent[];
}

async function getUpcomingHackathons(db: Database): Promise<ResourceResult> {
  const data = await db
    .select()
    .from(schema.hackathons)
    .where(eq(schema.hackathons.status, 'upcoming'))
    .orderBy(desc(schema.hackathons.startDate))
    .limit(20);

  return {
    contents: [
      {
        uri: 'hackertrip://hackathons/upcoming',
        mimeType: 'application/json',
        text: JSON.stringify({ hackathons: data, count: data.length }, null, 2),
      },
    ],
  };
}

async function getTrendingHackathons(db: Database): Promise<ResourceResult> {
  const data = await db
    .select()
    .from(schema.hackathons)
    .orderBy(desc(schema.hackathons.participantCount))
    .limit(10);

  return {
    contents: [
      {
        uri: 'hackertrip://hackathons/trending',
        mimeType: 'application/json',
        text: JSON.stringify({ hackathons: data, count: data.length }, null, 2),
      },
    ],
  };
}

async function getRecentWorks(db: Database): Promise<ResourceResult> {
  const data = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.verificationStatus, 'approved'))
    .orderBy(desc(schema.projects.createdAt))
    .limit(10);

  // Strip internal fields
  const sanitized = data.map(
    ({ aiReviewResult, adminReviewerId, adminReviewNotes, ...rest }) => rest
  );

  return {
    contents: [
      {
        uri: 'hackertrip://works/recent',
        mimeType: 'application/json',
        text: JSON.stringify({ works: sanitized, count: sanitized.length }, null, 2),
      },
    ],
  };
}

async function getPlatformStats(db: Database): Promise<ResourceResult> {
  const [hackathonCount, verifiedWorkCount, userCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.hackathons),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.projects)
      .where(eq(schema.projects.verificationStatus, 'approved')),
    db.select({ count: sql<number>`count(*)` }).from(schema.users),
  ]);

  const stats = {
    totalHackathons: Number(hackathonCount[0]?.count || 0),
    verifiedWorks: Number(verifiedWorkCount[0]?.count || 0),
    totalUsers: Number(userCount[0]?.count || 0),
  };

  return {
    contents: [
      {
        uri: 'hackertrip://stats',
        mimeType: 'application/json',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
}

// ============ Resource Dispatcher ============

export async function readResource(
  db: Database,
  uri: string
): Promise<ResourceResult | null> {
  switch (uri) {
    case 'hackertrip://hackathons/upcoming':
      return getUpcomingHackathons(db);
    case 'hackertrip://hackathons/trending':
      return getTrendingHackathons(db);
    case 'hackertrip://works/recent':
      return getRecentWorks(db);
    case 'hackertrip://stats':
      return getPlatformStats(db);
    default:
      return null;
  }
}
