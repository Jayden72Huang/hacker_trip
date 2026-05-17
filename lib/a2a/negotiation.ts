import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  a2aNegotiations,
  agentCards,
  agentTeamMembers,
  agentTeams,
} from '@/lib/db/schema';
import {
  findOverlap,
  jaccardSimilarity,
  toStringArray,
} from '@/lib/recommendations/engine';

export interface NegotiationProposal {
  teamName?: string;
  hackathonId?: string;
  roles: { userId: string; proposedRole: string }[];
  requiredSkills?: string[];
  message?: string;
}

export interface NegotiationRules {
  minSkillMatch?: number;
  requiredSkills?: string[];
  maxTeamSize?: number;
  preferredRoles?: string[];
  autoAcceptThreshold?: number;
}

export type AgentCard = typeof agentCards.$inferSelect;

type EvaluationResult = {
  score: number;
  meetsRules: boolean;
  reasons: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatPercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function normalizeRules(value: unknown): NegotiationRules {
  const raw = asRecord(value);
  return {
    minSkillMatch: asFiniteNumber(raw.minSkillMatch),
    requiredSkills: toStringArray(raw.requiredSkills),
    maxTeamSize: asFiniteNumber(raw.maxTeamSize),
    preferredRoles: toStringArray(raw.preferredRoles),
    autoAcceptThreshold: asFiniteNumber(raw.autoAcceptThreshold),
  };
}

function normalizeProposal(value: unknown): NegotiationProposal {
  const raw = asRecord(value);
  const rawRoles = Array.isArray(raw.roles) ? raw.roles : [];
  const roles = rawRoles
    .map((role) => {
      const record = asRecord(role);
      const userId = record.userId;
      const proposedRole = record.proposedRole;

      if (typeof userId !== 'string' || typeof proposedRole !== 'string') {
        return null;
      }

      return { userId, proposedRole };
    })
    .filter((role): role is { userId: string; proposedRole: string } =>
      Boolean(role)
    );

  return {
    teamName: typeof raw.teamName === 'string' ? raw.teamName : undefined,
    hackathonId:
      typeof raw.hackathonId === 'string' ? raw.hackathonId : undefined,
    roles,
    requiredSkills: toStringArray(raw.requiredSkills),
    message: typeof raw.message === 'string' ? raw.message : undefined,
  };
}

function getProposalRole(proposal: NegotiationProposal, userId: string): string {
  const proposedRole = proposal.roles.find((role) => role.userId === userId)
    ?.proposedRole;
  return proposedRole && proposedRole.trim() ? proposedRole : 'member';
}

function getProposedMemberCount(proposal: NegotiationProposal): number {
  const uniqueUserIds = new Set(
    proposal.roles
      .map((role) => role.userId)
      .filter((userId) => typeof userId === 'string' && userId.trim() !== '')
  );
  return Math.max(2, uniqueUserIds.size);
}

export function evaluateProposal(
  proposal: NegotiationProposal,
  responderCard: AgentCard,
  initiatorCard: AgentCard
): EvaluationResult {
  const rules = normalizeRules(responderCard.negotiationRules);
  const initiatorSkills = toStringArray(initiatorCard.skills);
  const responderSkills = toStringArray(responderCard.skills);
  const skillMatch = clamp01(jaccardSimilarity(initiatorSkills, responderSkills));
  const matchedSkills = findOverlap(initiatorSkills, responderSkills);
  const reasons: string[] = [];
  let meetsRules = true;

  if (matchedSkills.length > 0) {
    reasons.push(
      `技能匹配度 ${formatPercent(skillMatch)}，匹配技能：${matchedSkills.join(', ')}`
    );
  } else {
    reasons.push(`技能匹配度 ${formatPercent(skillMatch)}，双方技能暂无明显交集`);
  }

  if (typeof rules.minSkillMatch === 'number') {
    const minSkillMatch = clamp01(rules.minSkillMatch);
    if (skillMatch >= minSkillMatch) {
      reasons.push(`技能匹配达到最低要求：${formatPercent(minSkillMatch)}`);
    } else {
      meetsRules = false;
      reasons.push(
        `技能匹配未达最低要求：当前 ${formatPercent(skillMatch)}，要求 ${formatPercent(minSkillMatch)}`
      );
    }
  }

  const requiredSkills = rules.requiredSkills ?? [];
  const matchedRequiredSkills = findOverlap(requiredSkills, initiatorSkills);
  const missingRequiredSkills = requiredSkills.filter(
    (skill) =>
      !matchedRequiredSkills.some(
        (matchedSkill) => matchedSkill.toLowerCase() === skill.toLowerCase()
      )
  );

  if (requiredSkills.length > 0) {
    if (missingRequiredSkills.length === 0) {
      reasons.push(`发起方满足必需技能：${requiredSkills.join(', ')}`);
    } else {
      meetsRules = false;
      reasons.push(`发起方缺少必需技能：${missingRequiredSkills.join(', ')}`);
    }
  }

  const proposedMemberCount = getProposedMemberCount(proposal);
  if (typeof rules.maxTeamSize === 'number' && rules.maxTeamSize > 0) {
    if (proposedMemberCount <= rules.maxTeamSize) {
      reasons.push(
        `团队人数 ${proposedMemberCount} 人，符合上限 ${rules.maxTeamSize} 人`
      );
    } else {
      meetsRules = false;
      reasons.push(
        `团队人数 ${proposedMemberCount} 人，超过上限 ${rules.maxTeamSize} 人`
      );
    }
  }

  const preferredRoles = rules.preferredRoles ?? [];
  const proposedRoles = proposal.roles.map((role) => role.proposedRole);
  const matchedPreferredRoles = findOverlap(preferredRoles, proposedRoles);
  const preferredRoleScore =
    preferredRoles.length === 0
      ? undefined
      : matchedPreferredRoles.length / preferredRoles.length;

  if (preferredRoles.length > 0) {
    if (matchedPreferredRoles.length > 0) {
      reasons.push(`提案角色符合偏好：${matchedPreferredRoles.join(', ')}`);
    } else {
      reasons.push(`提案角色未覆盖偏好：${preferredRoles.join(', ')}`);
    }
  }

  const requiredSkillScore =
    requiredSkills.length === 0
      ? undefined
      : matchedRequiredSkills.length / requiredSkills.length;
  const teamSizeScore =
    typeof rules.maxTeamSize === 'number' && rules.maxTeamSize > 0
      ? clamp01(rules.maxTeamSize / proposedMemberCount)
      : undefined;
  const weightedScores = [{ value: skillMatch, weight: 0.6 }];

  if (typeof requiredSkillScore === 'number') {
    weightedScores.push({ value: requiredSkillScore, weight: 0.25 });
  }
  if (typeof preferredRoleScore === 'number') {
    weightedScores.push({ value: preferredRoleScore, weight: 0.1 });
  }
  if (typeof teamSizeScore === 'number') {
    weightedScores.push({ value: teamSizeScore, weight: 0.05 });
  }

  const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0);
  const score = clamp01(
    weightedScores.reduce((sum, item) => sum + item.value * item.weight, 0) /
      totalWeight
  );

  reasons.push(`综合评分：${score.toFixed(2)}`);

  return { score, meetsRules, reasons };
}

export function shouldAutoAccept(
  proposal: NegotiationProposal,
  responderCard: AgentCard,
  initiatorCard: AgentCard
): boolean {
  const rules = normalizeRules(responderCard.negotiationRules);
  const threshold = clamp01(rules.autoAcceptThreshold ?? 0.8);
  const evaluation = evaluateProposal(proposal, responderCard, initiatorCard);

  return Boolean(
    responderCard.autoNegotiate &&
      evaluation.meetsRules &&
      evaluation.score >= threshold
  );
}

export async function createTeamFromNegotiation(
  negotiationId: string
): Promise<string> {
  return db.transaction(async (tx) => {
    const [negotiation] = await tx
      .select()
      .from(a2aNegotiations)
      .where(eq(a2aNegotiations.id, negotiationId))
      .limit(1);

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.resultTeamId) {
      return negotiation.resultTeamId;
    }

    if (negotiation.status !== 'accepted') {
      throw new Error('Negotiation is not accepted');
    }

    if (!negotiation.finalProposal) {
      throw new Error('Negotiation does not have a final proposal');
    }

    const proposal = normalizeProposal(negotiation.finalProposal);

    const [initiatorCard] = await tx
      .select()
      .from(agentCards)
      .where(eq(agentCards.id, negotiation.initiatorAgentId))
      .limit(1);

    const [responderCard] = await tx
      .select()
      .from(agentCards)
      .where(eq(agentCards.id, negotiation.responderAgentId))
      .limit(1);

    if (!initiatorCard || !responderCard) {
      throw new Error('Negotiation agent card not found');
    }

    const [team] = await tx
      .insert(agentTeams)
      .values({
        name: proposal.teamName || 'New Team',
        hackathonId: proposal.hackathonId ?? negotiation.hackathonId ?? null,
        createdBy: initiatorCard.userId,
      })
      .returning();

    if (!team) {
      throw new Error('Failed to create team');
    }

    const memberRoles = new Map<string, string>();
    memberRoles.set(initiatorCard.userId, 'leader');
    if (!memberRoles.has(responderCard.userId)) {
      memberRoles.set(
        responderCard.userId,
        getProposalRole(proposal, responderCard.userId)
      );
    }

    await tx.insert(agentTeamMembers).values(
      Array.from(memberRoles, ([userId, role]) => ({
        teamId: team.id,
        userId,
        role,
      }))
    );

    const [updated] = await tx
      .update(a2aNegotiations)
      .set({
        resultTeamId: team.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(a2aNegotiations.id, negotiationId),
          isNull(a2aNegotiations.resultTeamId)
        )
      )
      .returning({ resultTeamId: a2aNegotiations.resultTeamId });

    if (updated?.resultTeamId) {
      return updated.resultTeamId;
    }

    await tx.delete(agentTeams).where(eq(agentTeams.id, team.id));

    const [current] = await tx
      .select({ resultTeamId: a2aNegotiations.resultTeamId })
      .from(a2aNegotiations)
      .where(eq(a2aNegotiations.id, negotiationId))
      .limit(1);

    if (current?.resultTeamId) {
      return current.resultTeamId;
    }

    throw new Error('Failed to attach team to negotiation');
  });
}
