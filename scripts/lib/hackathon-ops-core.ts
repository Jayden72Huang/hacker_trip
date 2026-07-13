import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { hackathonOpsConfig, reviewStatuses } from './hackathon-ops-config';

export interface ReviewCandidate {
  candidateId: string;
  name: string;
  shortName?: string;
  city?: string;
  country?: string;
  venue?: string;
  format?: string;
  theme?: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  prizePool?: string;
  teams?: string;
  tracks?: { title: string; description?: string }[];
  organizers?: { name: string; url?: string }[];
  sponsors?: { name: string }[];
  website?: string;
  sourceUrl: string;
  platform?: string;
  confidence: number;
  confidenceLevel: '高' | '中' | '低';
  confidenceReasons: string[];
  missingFields: string[];
  dedupeKey: string;
  batchDate: string;
  reviewStatus: string;
}

export type CandidateInput = Omit<ReviewCandidate,
  'candidateId' | 'confidence' | 'confidenceLevel' | 'confidenceReasons' |
  'missingFields' | 'dedupeKey' | 'reviewStatus'>;

function normalize(value: string | undefined): string {
  return (value || '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function buildCandidateId(input: Pick<CandidateInput, 'name' | 'sourceUrl' | 'startDate'>): string {
  const digest = crypto
    .createHash('sha256')
    .update(`${normalize(input.name)}|${input.startDate || ''}|${input.sourceUrl}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `HK-${digest}`;
}

export function buildDedupeKey(input: Pick<CandidateInput, 'name' | 'startDate' | 'city'>): string {
  return `${normalize(input.name)}|${input.startDate || ''}|${normalize(input.city)}`;
}

export function scoreCandidate(input: CandidateInput) {
  let score = 0;
  const reasons: string[] = [];
  const missing: string[] = [];
  const add = (condition: boolean, points: number, reason: string, missingName?: string) => {
    if (condition) {
      score += points;
      reasons.push(reason);
    } else if (missingName) {
      missing.push(missingName);
    }
  };

  add(Boolean(input.name), 15, '赛事名称明确', '赛事名称');
  add(Boolean(input.startDate && input.endDate), 20, '起止日期完整', '起止日期');
  add(Boolean(input.website || input.sourceUrl), 15, '存在可核验链接', '官网/报名链接');
  add(Boolean(input.city || input.format === 'online'), 10, '地点或线上形式明确', '地点/形式');
  add(Boolean(input.organizers?.length), 10, '主办方明确', '主办方');
  add(Boolean(input.tracks?.length || input.theme), 10, '主题或赛道明确', '主题/赛道');
  add(Boolean(input.summary), 8, '赛事简介明确', '简介');
  add(Boolean(input.prizePool), 5, '奖金信息明确', '奖金池');
  add(Boolean(input.registrationDeadline), 4, '报名截止时间明确', '报名截止');
  add(Boolean(input.teams), 3, '参赛规模明确');

  const sourceCount = new Set([input.sourceUrl, input.website].filter(Boolean)).size;
  if (sourceCount >= 2) {
    score += 10;
    reasons.push('至少两个独立链接可交叉核验');
  }

  score = Math.min(100, score);
  return {
    score,
    level: score >= 90 ? '高' as const : score >= 75 ? '中' as const : '低' as const,
    reasons,
    missing,
  };
}

export function createReviewCandidate(input: CandidateInput): ReviewCandidate {
  const scored = scoreCandidate(input);
  return {
    ...input,
    candidateId: buildCandidateId(input),
    dedupeKey: buildDedupeKey(input),
    confidence: scored.score,
    confidenceLevel: scored.level,
    confidenceReasons: scored.reasons,
    missingFields: scored.missing,
    reviewStatus: reviewStatuses.pending,
  };
}

interface ReviewLead {
  openId?: string;
  name?: string;
  role?: string;
}

export function buildReviewMessage(candidates: ReviewCandidate[], batchDate: string, reviewLead?: ReviewLead): string {
  const high = candidates.filter(item => item.confidenceLevel === '高').length;
  const medium = candidates.filter(item => item.confidenceLevel === '中').length;
  const low = candidates.length - high - medium;
  const baseUrl = `https://my.feishu.cn/base/${hackathonOpsConfig.eventBaseToken}?table=${hackathonOpsConfig.crawlerTableId}`;
  const leadLine = reviewLead?.openId && reviewLead.name
    ? `协作负责人：<at user_id="${reviewLead.openId}">${reviewLead.name}</at>${reviewLead.role ? `（${reviewLead.role}）` : ''}`
    : '';
  const lines = [
    `## HackerTrip 每日新赛事候选｜${batchDate}`,
    '',
    `今日新增 **${candidates.length}** 条：高置信度 ${high}｜待补充 ${medium}｜低置信度 ${low}`,
  ];
  if (leadLine) lines.push(leadLine);
  lines.push('');

  for (const [index, item] of candidates.slice(0, 10).entries()) {
    lines.push(
      `### ${index + 1}. ${item.name}`,
      `- 候选ID：${item.candidateId}`,
      `- 置信度：${item.confidence}（${item.confidenceLevel}）`,
      `- 时间：${item.startDate || '待核验'} ～ ${item.endDate || '待核验'}`,
      `- 地点：${[item.city, item.venue, item.format].filter(Boolean).join('｜') || '待核验'}`,
      `- 主办方：${item.organizers?.map(org => org.name).join(' / ') || '待核验'}`,
      `- 缺失：${item.missingFields.join('、') || '无核心缺失'}`,
      `- 来源：${item.sourceUrl}`,
      '',
    );
  }

  if (candidates.length > 10) lines.push(`其余 ${candidates.length - 10} 条请在采集表查看。`, '');
  lines.push(
    `审核入口：[打开「爬虫采集」表](${baseUrl})`,
    '',
    `将「审核状态」改为「${reviewStatuses.approved}」后，下一轮同步会自动进入赛事总表并发布到所选平台。`,
  );
  return lines.join('\n');
}

export function buildWxPreview(candidates: ReviewCandidate[], batchDate: string): string {
  const selected = [...candidates]
    .filter(item => item.reviewStatus === reviewStatuses.synced || item.reviewStatus === reviewStatuses.approved)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  const lines = [`【HackerTrip 今日黑客松｜${batchDate}】`, ''];
  for (const [index, item] of selected.entries()) {
    lines.push(
      `${index + 1}. ${item.name}`,
      `时间：${item.startDate || '待公布'} ～ ${item.endDate || '待公布'}`,
      `地点：${[item.city, item.format].filter(Boolean).join('｜') || '线上/待公布'}`,
      item.prizePool ? `奖金：${item.prizePool}` : '',
      item.summary || item.theme || '',
      `报名：${item.website || item.sourceUrl}`,
      '',
    );
  }
  if (selected.length === 0) lines.push('今日暂无审核通过的新赛事。');
  lines.push('更多赛事请前往 HackerTrip 网站或小程序查看。');
  return lines.filter((line, index, all) => line || all[index - 1] !== '').join('\n');
}

export function writeRuntimeArtifact(batchDate: string, filename: string, content: string): string {
  const dir = path.join(hackathonOpsConfig.runtimeDir, batchDate);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, filename);
  fs.writeFileSync(target, content, 'utf8');
  return target;
}
