/**
 * Recommend Hackathons Tool
 *
 * Generates personalized hackathon recommendations for the current user
 * and formats them for chat display.
 */

import type { ToolResult, ToolContext } from './types';
import { db } from '@/lib/db';
import { agentTeamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRecommendations } from '@/lib/recommendations/engine';

interface RecommendHackathonsInput {
  limit?: number;
}

export async function recommendHackathons(
  input: RecommendHackathonsInput,
  context: ToolContext
): Promise<ToolResult> {
  const { limit = 5 } = input;
  const clampedLimit = Math.min(Math.max(limit, 1), 10);

  try {
    // Resolve the calling user from the team context
    const members = await db
      .select()
      .from(agentTeamMembers)
      .where(eq(agentTeamMembers.teamId, context.teamId));

    if (members.length === 0) {
      return {
        success: false,
        content: '',
        error: '无法确定当前用户，请确保已加入团队。',
      };
    }

    // Use the first member (typically the team creator / current user)
    const userId = members[0].userId;

    const results = await generateRecommendations(userId);
    const topN = results.slice(0, clampedLimit);

    if (topN.length === 0) {
      return {
        success: true,
        content:
          '目前没有找到匹配的推荐黑客松。可能原因：\n' +
          '- 当前没有即将举办的黑客松\n' +
          '- 请完善你的个人档案（技能、兴趣、偏好赛道）以获得更精准的推荐',
        metadata: { count: 0 },
      };
    }

    const lines = topN.map((r, i) => {
      const h = r.hackathon;
      const startStr =
        h.startDate instanceof Date
          ? h.startDate.toLocaleDateString('zh-CN')
          : String(h.startDate);
      const endStr =
        h.endDate instanceof Date
          ? h.endDate.toLocaleDateString('zh-CN')
          : String(h.endDate);

      const parts = [
        `### ${i + 1}. ${h.name} (匹配度: ${r.score}分)`,
        h.description ? `> ${h.description.slice(0, 100)}...` : '',
        `- **时间**: ${startStr} ~ ${endStr}`,
        h.prizePool ? `- **奖金池**: ${h.prizePool}` : '',
        h.mode ? `- **模式**: ${h.mode}` : '',
        h.location ? `- **地点**: ${h.location}` : '',
        r.matchedSkills.length > 0
          ? `- **匹配技能**: ${r.matchedSkills.join(', ')}`
          : '',
        r.matchedInterests.length > 0
          ? `- **匹配兴趣**: ${r.matchedInterests.join(', ')}`
          : '',
        `- **推荐理由**: ${r.reasons.join(' | ')}`,
        h.website ? `- **链接**: ${h.website}` : '',
      ];

      return parts.filter(Boolean).join('\n');
    });

    const content =
      `为你找到 ${topN.length} 个推荐黑客松：\n\n` + lines.join('\n\n');

    return {
      success: true,
      content,
      metadata: { count: topN.length, totalScored: results.length },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      content: '',
      error: `推荐生成失败: ${message}`,
    };
  }
}
