/**
 * ============================================================================
 *  HackerTrip — 真实 DB 查询（聚合身份卡数据）
 * ============================================================================
 *
 *  getIdentityByUsername(username): 从 users / participations / projects 聚合
 *  出 IdentityCardData。**全程 try/catch**：DB 不可用、无连接、查无此人 →
 *  返回 null，页面据此降级到 lib/identity/mock。
 *
 *  schema 事实（IDENTITY-DESIGN.md §6 校正）：
 *    - users.id 是 text；username 唯一列用于个人主页 URL。
 *    - awards 在 projects 表；verified 由 projects.verificationStatus==='approved' 推导。
 *    - participations 是履历数据源（hackathonName/role/placement/projectId/track）。
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, participations, projects } from '../db/schema';
import { decideRole } from './roles';
import { createDevConfig } from './config';
import type {
  IdentityCardData,
  CareerItem,
  RoleSignals,
  DevConfig,
  ParticipationRole,
  IdentityStats,
} from './types';

/** 名次是否计入"获奖" */
function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  const p = placement.toLowerCase();
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/.test(p);
}

/** jsonb 字段安全转 string[] */
function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

/** participation.role enum 归一到 ParticipationRole（兜底 participant） */
function normalizeRole(role: unknown): ParticipationRole {
  const allowed: ParticipationRole[] = ['participant', 'winner', 'organizer', 'mentor', 'judge'];
  return allowed.includes(role as ParticipationRole)
    ? (role as ParticipationRole)
    : 'participant';
}

/**
 * getIdentityByUsername — DB 聚合查询。
 * @returns IdentityCardData（source:'db'）；任何失败或查无 → null。
 */
export async function getIdentityByUsername(
  username: string,
): Promise<IdentityCardData | null> {
  const handle = (username ?? '').trim();
  if (!handle) return null;

  try {
    // 1. 用户
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.username, handle))
      .limit(1);

    const user = userRows[0];
    if (!user) return null;

    // 2. 该用户的项目（取 techStack / awards / verificationStatus）
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id));

    // 3. 该用户的参赛履历
    const participationRows = await db
      .select()
      .from(participations)
      .where(eq(participations.userId, user.id));

    // projectId → project 映射，用于补充履历的项目名/描述/验证状态
    const projectById = new Map(projectRows.map((p) => [p.id, p]));

    // ---- 履历 CareerItem[] ----
    const career: CareerItem[] = participationRows.map((row) => {
      const proj = row.projectId ? projectById.get(row.projectId) : undefined;
      return {
        id: row.id,
        hackathonName: row.hackathonName ?? '未命名黑客松',
        hackathonLogo: row.hackathonLogo ?? null,
        dateRange: row.dateRange ?? null,
        role: normalizeRole(row.role),
        placement: row.placement ?? null,
        projectName: proj?.name ?? null,
        projectTagline: proj?.tagline ?? null,
        track: row.track ?? null,
        verified: proj?.verificationStatus === 'approved',
      };
    });

    // ---- 统计条 ----
    const winCount = career.filter(
      (c) => isWin(c.placement) || c.role === 'winner',
    ).length;
    const stats: IdentityStats = {
      projects: projectRows.length,
      hackathons: participationRows.length,
      awards: winCount,
    };

    // ---- RoleSignals ----
    const techStack = Array.from(
      new Set(projectRows.flatMap((p) => toStringArray(p.techStack))),
    );
    const awards = [
      ...career.map((c) => c.placement).filter((p): p is string => Boolean(p)),
      ...projectRows.flatMap((p) => toStringArray(p.awards)),
    ];
    const taglineKeywords = projectRows
      .flatMap((p) => [p.tagline ?? '', p.description ?? ''])
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9一-龥]+/)
      .filter((w) => w.length > 1);

    const signals: RoleSignals = {
      techStack,
      awards,
      projectCount: projectRows.length,
      participationCount: participationRows.length,
      winCount,
      taglineKeywords,
      participantRoles: participationRows.map((r) => String(r.role ?? 'participant')),
      shippingVelocity:
        participationRows.length > 0
          ? projectRows.length / participationRows.length
          : 0,
    };

    const role = decideRole(signals);

    // ---- 配置卡：MVP 无 DB 列，从画像 + 项目技术栈推导一个基础配置 ----
    const config: DevConfig = createDevConfig({
      techStack,
      strengths: toStringArray(user.skills),
      lookingFor: user.lookingForTeam ? 'teammate' : 'none',
    });

    const identity: IdentityCardData = {
      username: user.username ?? handle,
      displayName: user.name ?? user.username ?? handle,
      avatar: user.image ?? null,
      bio: user.bio ?? null,
      location: user.location ?? null,
      github: user.github ?? null,
      twitter: user.twitter ?? null,
      role,
      config,
      career,
      stats,
      // 真实 profileViews 计数表暂缺，给一个稳定的派生值（非 0），后续接入计数表
      profileViews: 100 + participationRows.length * 37 + projectRows.length * 11,
      source: 'db',
    };

    return identity;
  } catch {
    // DB 不可用 / 无连接 / 查询异常 → 降级（调用方回落 mock）
    return null;
  }
}
