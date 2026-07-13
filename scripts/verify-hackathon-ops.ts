import assert from 'node:assert/strict';
import { buildCandidateId, buildDedupeKey, buildReviewMessage, buildWxPreview, createReviewCandidate } from './lib/hackathon-ops-core';
import { reviewStatuses } from './lib/hackathon-ops-config';

const complete = createReviewCandidate({
  name: 'HackerTrip AI Hackathon 2026',
  city: '上海',
  country: '中国',
  venue: '张江科学会堂',
  format: 'offline',
  theme: 'AI Agent',
  summary: '面向开发者的 AI Agent 黑客松。',
  startDate: '2026-08-15',
  endDate: '2026-08-17',
  registrationDeadline: '2026-08-10',
  prizePool: '¥100,000',
  teams: '100支队伍',
  tracks: [{ title: 'AI Agent' }],
  organizers: [{ name: 'HackerTrip' }],
  website: 'https://hackertrip.space/hackathon/example',
  sourceUrl: 'https://example.com/hackathon',
  platform: 'official',
  batchDate: '2026-07-13',
});

assert.equal(complete.confidence, 100);
assert.equal(complete.confidenceLevel, '高');
assert.equal(complete.reviewStatus, reviewStatuses.pending);
assert.match(complete.candidateId, /^HK-[A-F0-9]{10}$/);
assert.equal(buildCandidateId(complete), complete.candidateId);
assert.equal(buildDedupeKey(complete), complete.dedupeKey);

const incomplete = createReviewCandidate({
  name: '待核验黑客松',
  sourceUrl: 'https://example.com/pending',
  batchDate: '2026-07-13',
});
assert.equal(incomplete.confidenceLevel, '低');
assert.ok(incomplete.missingFields.includes('起止日期'));

const reviewMessage = buildReviewMessage([complete, incomplete], '2026-07-13', {
  openId: 'ou_mandy',
  name: '柳艺Mandy',
  role: '活动和市场负责人',
});
assert.ok(reviewMessage.includes(complete.candidateId));
assert.ok(reviewMessage.includes('爬虫采集'));
assert.ok(reviewMessage.includes('<at user_id="ou_mandy">柳艺Mandy</at>（活动和市场负责人）'));

const wxPreview = buildWxPreview([{ ...complete, reviewStatus: reviewStatuses.synced }], '2026-07-13');
assert.ok(wxPreview.includes('HackerTrip AI Hackathon 2026'));
assert.ok(wxPreview.includes('https://hackertrip.space/hackathon/example'));

console.log('✅ HackerTrip 赛事闭环核心逻辑验证通过');
