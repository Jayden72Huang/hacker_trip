/**
 * Search Verified Works Tool
 *
 * Searches approved hackathon projects on the platform for reference
 * and inspiration during brainstorming or pitch preparation.
 */

import type { ToolResult } from './types';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';

interface SearchVerifiedWorksInput {
  query?: string;
  hackathon_name?: string;
  tech_stack?: string[];
  limit?: number;
}

export async function searchVerifiedWorks(
  input: SearchVerifiedWorksInput
): Promise<ToolResult> {
  const { query, hackathon_name, tech_stack, limit = 5 } = input;
  const clampedLimit = Math.min(Math.max(limit, 1), 20);

  try {
    const conditions = [eq(projects.verificationStatus, 'approved')];

    if (query) {
      // Search across name, tagline, and description
      conditions.push(
        sql`(${ilike(projects.name, `%${query}%`)} OR ${ilike(projects.tagline, `%${query}%`)} OR ${ilike(projects.description, `%${query}%`)})`
      );
    }

    if (hackathon_name) {
      conditions.push(ilike(projects.hackathonName, `%${hackathon_name}%`));
    }

    if (tech_stack && tech_stack.length > 0) {
      // Match any of the provided tech stack items using jsonb containment
      const techConditions = tech_stack.map(
        (tech) =>
          sql`${projects.techStack}::jsonb @> ${JSON.stringify([tech])}::jsonb`
      );
      conditions.push(sql`(${sql.join(techConditions, sql` OR `)})`);
    }

    const where = and(...conditions);

    const results = await db
      .select({
        id: projects.id,
        name: projects.name,
        tagline: projects.tagline,
        description: projects.description,
        techStack: projects.techStack,
        tracks: projects.tracks,
        awards: projects.awards,
        hackathonName: projects.hackathonName,
        demoUrl: projects.demoUrl,
        repoUrl: projects.repoUrl,
        coverImage: projects.coverImage,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(where)
      .orderBy(desc(projects.createdAt))
      .limit(clampedLimit);

    if (results.length === 0) {
      const searchTerms = [
        query && `"${query}"`,
        hackathon_name && `黑客松"${hackathon_name}"`,
        tech_stack?.length && `技术栈 [${tech_stack.join(', ')}]`,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        success: true,
        content: `没有找到匹配 ${searchTerms || '条件'} 的已验证作品。试试调整搜索条件？`,
        metadata: { count: 0 },
      };
    }

    const lines = results.map((p, i) => {
      const techList = Array.isArray(p.techStack)
        ? (p.techStack as string[]).join(', ')
        : '';
      const trackList = Array.isArray(p.tracks)
        ? (p.tracks as string[]).join(', ')
        : '';
      const awardList = Array.isArray(p.awards)
        ? (p.awards as string[]).join(', ')
        : '';

      const parts = [
        `### ${i + 1}. ${p.name}`,
        p.tagline ? `> ${p.tagline}` : '',
        p.description
          ? `${p.description.slice(0, 200)}${p.description.length > 200 ? '...' : ''}`
          : '',
        p.hackathonName ? `- **黑客松**: ${p.hackathonName}` : '',
        techList ? `- **技术栈**: ${techList}` : '',
        trackList ? `- **赛道**: ${trackList}` : '',
        awardList ? `- **获奖**: ${awardList}` : '',
        p.demoUrl ? `- **Demo**: ${p.demoUrl}` : '',
        p.repoUrl ? `- **源码**: ${p.repoUrl}` : '',
      ];

      return parts.filter(Boolean).join('\n');
    });

    const content =
      `找到 ${results.length} 个已验证的黑客松作品：\n\n` +
      lines.join('\n\n');

    return {
      success: true,
      content,
      metadata: { count: results.length },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      content: '',
      error: `搜索作品失败: ${message}`,
    };
  }
}
