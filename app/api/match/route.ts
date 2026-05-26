import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { or, eq, desc } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface MatchHackathon {
  name: string;
  slug: string;
  mode: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  tracks: string[];
  techStack: string[];
  tags: string[];
  theme: string;
  summary: string;
  prizePool: string;
  website: string;
  location: string | null;
}

function toMatchHackathon(row: any): MatchHackathon {
  let tracks: string[] = [];
  if (Array.isArray(row.tracks)) {
    tracks = row.tracks.map((t: any) => (typeof t === 'string' ? t : t.title)).filter(Boolean);
  }

  const techStack: string[] = Array.isArray(row.techStack) ? row.techStack : [];
  const tags: string[] = Array.isArray(row.tags) ? row.tags : [];

  const summary = (row.summary || row.description || '').slice(0, 200);

  const registrationUrl =
    (row.registration as any)?.url || row.website || row.sourceUrl || '';

  return {
    name: row.name,
    slug: row.slug,
    mode: row.mode || 'hybrid',
    startDate: row.startDate instanceof Date ? row.startDate.toISOString().split('T')[0] : String(row.startDate),
    endDate: row.endDate instanceof Date ? row.endDate.toISOString().split('T')[0] : String(row.endDate),
    registrationDeadline: row.registrationDeadline
      ? (row.registrationDeadline instanceof Date
          ? row.registrationDeadline.toISOString().split('T')[0]
          : String(row.registrationDeadline))
      : null,
    tracks,
    techStack,
    tags,
    theme: row.theme || '',
    summary,
    prizePool: row.prizePool || '',
    website: registrationUrl,
    location: [row.city, row.country].filter(Boolean).join(', ') || null,
  };
}

function toMarkdown(hackathons: MatchHackathon[]): string {
  const now = new Date().toISOString().split('T')[0];
  let md = `# HackerTrip — Upcoming Hackathons\n`;
  md += `> 中国黑客松聚合平台 | Updated: ${now}\n`;
  md += `> Website: https://hackertrip.space | API Docs: https://hackertrip.space/llms-full.txt\n\n`;

  hackathons.forEach((h, i) => {
    md += `## ${i + 1}. ${h.name}\n`;
    md += `- Dates: ${h.startDate} → ${h.endDate}\n`;
    if (h.registrationDeadline) md += `- Deadline: ${h.registrationDeadline}\n`;
    md += `- Mode: ${h.mode}`;
    if (h.prizePool) md += ` | Prize: ${h.prizePool}`;
    md += '\n';
    if (h.theme) md += `- Theme: ${h.theme}\n`;
    if (h.tracks.length) md += `- Tracks: ${h.tracks.join(', ')}\n`;
    if (h.techStack.length) md += `- Tech: ${h.techStack.join(', ')}\n`;
    if (h.tags.length) md += `- Tags: ${h.tags.join(', ')}\n`;
    if (h.location) md += `- Location: ${h.location}\n`;
    if (h.website) md += `- Register: ${h.website}\n`;
    md += '\n';
  });

  return md;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get('format') || 'json';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const results = await db
    .select()
    .from(hackathons)
    .where(or(eq(hackathons.status, 'upcoming'), eq(hackathons.status, 'ongoing')))
    .orderBy(desc(hackathons.startDate))
    .limit(limit);

  const matched = results.map(toMatchHackathon);

  if (format === 'markdown') {
    return new Response(toMarkdown(matched), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  return NextResponse.json(
    { hackathons: matched, count: matched.length, updated: new Date().toISOString() },
    {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}
