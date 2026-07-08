import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  jsonb,
  date,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';
import type { Organizer, Sponsor } from '../types/hackathon';

// ============ 枚举 ============

export const hackathonMode = pgEnum('hackathon_mode', ['online', 'offline', 'hybrid']);
export const hackathonStatus = pgEnum('hackathon_status', ['upcoming', 'ongoing', 'ended']);
export const participationRole = pgEnum('participation_role', [
  'participant',
  'winner',
  'organizer',
  'mentor',
  'judge',
  // 观众：线下到场扫码领「观众卡」，不参赛
  'audience',
]);
export const organizerStatus = pgEnum('organizer_status', ['pending', 'approved', 'rejected']);
export const verificationStatus = pgEnum('verification_status', [
  'draft', 'pending', 'ai_reviewed', 'approved', 'rejected',
]);
export const articleStatus = pgEnum('article_status', [
  'invited', 'draft', 'in_review', 'published', 'rejected',
]);
export const articleType = pgEnum('article_type', [
  'experience', 'interview', 'guest_post',
]);

// ============ 私信 & A2A 枚举 ============

export const messageStatus = pgEnum('message_status', ['sent', 'delivered', 'read']);
export const messageType = pgEnum('message_type', [
  'text', 'team_invite', 'team_request', 'agent_negotiation', 'system',
]);
export const negotiationStatus = pgEnum('negotiation_status', [
  'proposed', 'counter_proposed', 'accepted', 'rejected', 'expired',
]);

// ============ NextAuth 必需表 ============

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('user'),
  // 扩展字段 / 画像
  username: text('username').unique(),
  bio: text('bio'),
  location: text('location'),
  github: text('github'),
  twitter: text('twitter'),
  linkedin: text('linkedin'),
  website: text('website'),
  skills: jsonb('skills').default(sql`'[]'::jsonb`),
  interests: jsonb('interests').default(sql`'[]'::jsonb`),
  preferredTracks: jsonb('preferred_tracks').default(sql`'[]'::jsonb`),
  experienceLevel: text('experience_level').default('beginner'),
  lookingForTeam: boolean('looking_for_team').default(false),
  notificationPrefs: jsonb('notification_prefs').default(sql`'{"hackathonAlerts":true,"registrationReminders":true,"teamInvites":true,"systemAnnouncements":true,"emailNotifications":false}'::jsonb`),
  agentModeEnabled: boolean('agent_mode_enabled').default(false),
  agentVisibility: jsonb('agent_visibility').default(sql`'{"skills":true,"interests":true,"lookingForTeam":true,"experienceLevel":true,"projects":false,"participations":false}'::jsonb`),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ 组织者档案 ============

export const organizerProfiles = pgTable('organizer_profile', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  website: text('website'),
  role: text('role').notNull(), // 在组织中的角色：organizer, sponsor, partner, community
  status: organizerStatus('status').default('pending'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  rejectedAt: timestamp('rejected_at', { mode: 'date' }),
  rejectionReason: text('rejection_reason'),
});

// ============ 黑客松主表 ============

export const hackathons = pgTable(
  'hackathon',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    logo: text('logo'),
    coverImage: text('cover_image'),
    website: text('website'),
    startDate: date('start_date', { mode: 'date' }).notNull(),
    endDate: date('end_date', { mode: 'date' }).notNull(),
    registrationDeadline: date('registration_deadline', { mode: 'date' }),
    mode: hackathonMode('mode').default('hybrid'),
    location: text('location'),
    timezone: text('timezone').default('UTC'),
    tracks: jsonb('tracks').default(sql`'[]'::jsonb`),
    tags: jsonb('tags').default(sql`'[]'::jsonb`),
    techStack: jsonb('tech_stack').default(sql`'[]'::jsonb`),
    prizePool: text('prize_pool'),
    prizes: jsonb('prizes').default(sql`'[]'::jsonb`),
    organizer: text('organizer'),
    sponsors: jsonb('sponsors').$type<Sponsor[]>().default(sql`'[]'::jsonb`),
    // 首页展示所需字段
    shortName: text('short_name'),
    city: text('city'),
    country: text('country').default('中国'),
    venue: text('venue'),
    theme: text('theme'),
    summary: text('summary'),
    teams: text('teams'),
    brief: text('brief'),
    hostOrganizer: text('host_organizer'),
    agenda: jsonb('agenda').default(sql`'[]'::jsonb`),
    registration: jsonb('registration'),
    infoCards: jsonb('info_cards'),
    organizers: jsonb('organizers').$type<Organizer[]>().default(sql`'[]'::jsonb`),
    status: hackathonStatus('status').default('upcoming'),
    participantCount: integer('participant_count').default(0),
    projectCount: integer('project_count').default(0),
    sourceUrl: text('source_url'),
    feishuId: text('feishu_id').unique(),
    isVerified: boolean('is_verified').default(false),
    isFeatured: boolean('is_featured').default(false),
    // 软下架开关：false = 已下架，公开列表/详情页/sitemap 不展示，数据仍保留可恢复
    isPublished: boolean('is_published').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => ({
    slugUnique: uniqueIndex('hackathon_slug_unique').on(table.slug),
  })
);

// ============ 项目/作品 ============

export const projects = pgTable('project', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  coverImage: text('cover_image'),
  gallery: jsonb('gallery').default(sql`'[]'::jsonb`),
  demoUrl: text('demo_url'),
  repoUrl: text('repo_url'),
  videoUrl: text('video_url'),
  devpostUrl: text('devpost_url'),
  techStack: jsonb('tech_stack').default(sql`'[]'::jsonb`),
  tracks: jsonb('tracks').default(sql`'[]'::jsonb`),
  awards: jsonb('awards').default(sql`'[]'::jsonb`),
  hackathonId: text('hackathon_id').references(() => hackathons.id, { onDelete: 'set null' }),
  hackathonName: text('hackathon_name'),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  // 验证系统字段
  externalHackathonUrl: text('external_hackathon_url'),
  verificationStatus: verificationStatus('verification_status').default('draft'),
  aiConfidenceScore: integer('ai_confidence_score'),
  aiReviewResult: jsonb('ai_review_result'),
  aiReviewedAt: timestamp('ai_reviewed_at', { mode: 'date' }),
  adminReviewerId: text('admin_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  adminReviewNotes: text('admin_review_notes'),
  adminReviewedAt: timestamp('admin_reviewed_at', { mode: 'date' }),
  roleInProject: text('role_in_project'),
  screenshots: jsonb('screenshots').default(sql`'[]'::jsonb`),
  videoKey: text('video_key'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ 黑客松参赛记录 ============

export const participations = pgTable('participation', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  hackathonId: text('hackathon_id').references(() => hackathons.id, { onDelete: 'set null' }),
  hackathonName: text('hackathon_name'),
  hackathonLogo: text('hackathon_logo'),
  dateRange: text('date_range'),
  role: participationRole('role').default('participant'),
  teamName: text('team_name'),
  placement: text('placement'), // '1st', '2nd', 'finalist', etc.
  projectId: text('project_id').references(() => projects.id),
  track: text('track'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ 队友关系 ============

export const teammates = pgTable(
  'teammate',
  {
    participationId: text('participation_id')
      .notNull()
      .references(() => participations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(), // 非注册用户也能记录名字
    avatar: text('avatar'),
    role: text('role'), // 'leader', 'member'
    github: text('github'),
    linkedin: text('linkedin'),
  },
  (teammate) => [
    primaryKey({
      columns: [teammate.participationId, teammate.name],
    }),
  ]
);

// ============ 收藏/提醒 ============

export const bookmarks = pgTable(
  'bookmark',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hackathonId: text('hackathon_id')
      .notNull()
      .references(() => hackathons.id, { onDelete: 'cascade' }),
    notifyMe: boolean('notify_me').default(true),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (bookmark) => [
    primaryKey({ columns: [bookmark.userId, bookmark.hackathonId] }),
  ]
);

// ============ 推荐记录 ============

export const recommendations = pgTable('recommendation', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  hackathonId: text('hackathon_id')
    .notNull()
    .references(() => hackathons.id, { onDelete: 'cascade' }),
  score: integer('score').default(0),
  reasons: jsonb('reasons').default(sql`'[]'::jsonb`),
  matchedSkills: jsonb('matched_skills').default(sql`'[]'::jsonb`),
  matchedInterests: jsonb('matched_interests').default(sql`'[]'::jsonb`),
  isViewed: boolean('is_viewed').default(false),
  isClicked: boolean('is_clicked').default(false),
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ============ Hacker Bot 枚举 ============

export const agentSessionStatus = pgEnum('agent_session_status', [
  'active', 'paused', 'completed', 'archived',
]);

export const agentMessageRole = pgEnum('agent_message_role', [
  'user', 'assistant', 'system', 'tool',
]);

export const agentArtifactType = pgEnum('agent_artifact_type', [
  'analysis_report', 'idea_card', 'feasibility_matrix',
  'task_board', 'timeline', 'resource_report',
  'pitch_outline', 'demo_script', 'project_description',
  'checklist', 'custom',
]);

export const taskStatus = pgEnum('task_status', [
  'todo', 'in_progress', 'review', 'done', 'blocked',
]);

export const taskPriority = pgEnum('task_priority', ['p0', 'p1', 'p2']);

// ============ Hacker Bot 团队 ============

export const agentTeams = pgTable('agent_team', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  hackathonId: text('hackathon_id')
    .references(() => hackathons.id, { onDelete: 'set null' }),
  hackathonName: text('hackathon_name'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  openclawSessionId: text('openclaw_session_id'),
  selectedTrack: text('selected_track'),
  selectedIdea: text('selected_idea'),
  anthropicApiKey: text('anthropic_api_key'),
  openclawApiKey: text('openclaw_api_key'),
  llmProvider: text('llm_provider'),
  llmApiKey: text('llm_api_key'),
  llmBaseUrl: text('llm_base_url'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 团队成员 ============

export const agentTeamMembers = pgTable(
  'agent_team_member',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => agentTeams.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('member'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.userId] }),
  ]
);

// ============ Hacker Bot 会话 ============

export const agentSessions = pgTable('agent_session', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id')
    .notNull()
    .references(() => agentTeams.id, { onDelete: 'cascade' }),
  channelType: text('channel_type').default('webchat'),
  channelId: text('channel_id'),
  status: agentSessionStatus('status').default('active'),
  activeSkill: text('active_skill'),
  contextSummary: text('context_summary'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 消息 ============

export const agentMessages = pgTable('agent_message', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => agentSessions.id, { onDelete: 'cascade' }),
  role: agentMessageRole('role').notNull(),
  content: text('content').notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  skillName: text('skill_name'),
  toolCalls: jsonb('tool_calls'),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 生成物 ============

export const agentArtifacts = pgTable('agent_artifact', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => agentSessions.id, { onDelete: 'cascade' }),
  teamId: text('team_id')
    .notNull()
    .references(() => agentTeams.id, { onDelete: 'cascade' }),
  type: agentArtifactType('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  structuredData: jsonb('structured_data'),
  version: integer('version').default(1),
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 赛题分析报告 ============

export const agentAnalysisReports = pgTable('agent_analysis_report', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id')
    .notNull()
    .references(() => agentTeams.id, { onDelete: 'cascade' }),
  hackathonId: text('hackathon_id')
    .references(() => hackathons.id, { onDelete: 'set null' }),
  tracks: jsonb('tracks').default(sql`'[]'::jsonb`),
  judgingCriteria: jsonb('judging_criteria').default(sql`'[]'::jsonb`),
  rules: jsonb('rules').default(sql`'{}'::jsonb`),
  timeAllocation: jsonb('time_allocation').default(sql`'{}'::jsonb`),
  recommendedTracks: jsonb('recommended_tracks').default(sql`'[]'::jsonb`),
  strategyNotes: text('strategy_notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 任务看板 ============

export const agentTaskBoards = pgTable('agent_task_board', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id')
    .notNull()
    .references(() => agentTeams.id, { onDelete: 'cascade' }),
  taskId: text('task_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatus('status').default('todo'),
  priority: taskPriority('priority').default('p1'),
  assigneeId: text('assignee_id')
    .references(() => users.id, { onDelete: 'set null' }),
  estimatedHours: integer('estimated_hours'),
  dependencies: jsonb('dependencies').default(sql`'[]'::jsonb`),
  module: text('module'),
  dueAt: timestamp('due_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ Hacker Bot 提醒 ============

export const agentReminders = pgTable('agent_reminder', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id')
    .notNull()
    .references(() => agentTeams.id, { onDelete: 'cascade' }),
  sessionId: text('session_id')
    .references(() => agentSessions.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').default('custom'), // deadline | milestone | checkin | custom
  remindAt: timestamp('remind_at', { mode: 'date' }).notNull(),
  status: text('status').default('pending'), // pending | triggered | dismissed
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  triggeredAt: timestamp('triggered_at', { mode: 'date' }),
});

// ============ 内测需求收集表 ============

export const betaRequests = pgTable('beta_request', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull(), // 'hacker-agent', 'other-agent', etc.
  feedback: text('feedback'), // 用户期待的功能/遇到的问题
  emailSent: boolean('email_sent').default(false), // 是否已发送邮件（后台批量发送用）
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ 爬虫系统表 ============

// 爬取目标配置表
export const scrapeTargets = pgTable('scrape_target', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(), // 目标名称（如 "DoraHacks 中国"）
  url: text('url').notNull(), // 目标 URL
  platform: text('platform').notNull(), // 平台类型（DoraHacks/牛客网等）
  enabled: boolean('enabled').default(true), // 是否启用
  schedule: text('schedule').notNull(), // cron 表达式（"daily", "weekly", "*/6h"）
  lastScrapedAt: timestamp('last_scraped_at', { mode: 'date' }), // 上次爬取时间
  lastStatus: text('last_status'), // 上次爬取状态（success/error）
  successCount: integer('success_count').default(0), // 成功次数
  errorCount: integer('error_count').default(0), // 失败次数
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// 爬取日志表
export const scrapeLogs = pgTable('scrape_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  targetId: text('target_id')
    .references(() => scrapeTargets.id, { onDelete: 'set null' }),
  url: text('url').notNull(), // 实际爬取的 URL
  platform: text('platform'), // 识别的平台
  status: text('status').notNull(), // success/error
  confidence: integer('confidence'), // 置信度（0-100）
  itemsFound: integer('items_found').default(0), // 发现的黑客松数量
  itemsSaved: integer('items_saved').default(0), // 保存到草稿箱的数量
  errorMessage: text('error_message'), // 错误信息
  duration: integer('duration'), // 执行时长（ms）
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`), // 额外元数据
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// 黑客松草稿箱表
export const draftHackathons = pgTable('draft_hackathon', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sourceUrl: text('source_url').notNull(), // 来源 URL
  platform: text('platform'), // 来源平台
  scrapeLogId: text('scrape_log_id')
    .references(() => scrapeLogs.id, { onDelete: 'set null' }),

  // 提取的黑客松信息
  name: text('name'),
  shortName: text('short_name'),
  city: text('city'),
  country: text('country').default('中国'),
  venue: text('venue'),
  dateRange: text('date_range'),
  startDate: date('start_date', { mode: 'date' }),
  endDate: date('end_date', { mode: 'date' }),
  format: text('format'), // online/offline/hybrid
  theme: text('theme'),
  summary: text('summary'),
  prizePool: text('prize_pool'),
  teams: text('teams'),
  tracks: jsonb('tracks').default(sql`'[]'::jsonb`),
  agenda: jsonb('agenda').default(sql`'[]'::jsonb`),
  organizers: jsonb('organizers').$type<Organizer[]>().default(sql`'[]'::jsonb`),
  sponsors: jsonb('sponsors').$type<Sponsor[]>().default(sql`'[]'::jsonb`),

  // 元数据
  confidence: integer('confidence'), // 数据置信度（0-100）
  rawData: jsonb('raw_data'), // 原始爬取数据
  status: text('status').default('pending'), // pending/approved/rejected/published
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewNotes: text('review_notes'),
  publishedHackathonId: text('published_hackathon_id')
    .references(() => hackathons.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
});

// ============ 作品团队成员 ============

export const workTeamMembers = pgTable('work_team_member', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  role: text('role'),
  avatar: text('avatar'),
  github: text('github'),
  linkedin: text('linkedin'),
});

// ============ 作品验证日志 ============

export const verificationLogs = pgTable('verification_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // submitted, ai_review, admin_approve, admin_reject, resubmit
  actorId: text('actor_id')
    .references(() => users.id, { onDelete: 'set null' }),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ API Key 管理 ============

export const apiKeys = pgTable('api_key', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(), // 前 8 字符用于展示
  tier: text('tier').default('free'), // free, pro, enterprise
  rateLimitRpm: integer('rate_limit_rpm').default(30),
  rateLimitRpd: integer('rate_limit_rpd').default(500),
  scopes: jsonb('scopes').default(sql`'["read"]'::jsonb`),
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  requestCount: integer('request_count').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
});

// ============ 通知系统 ============

export const notifications = pgTable('notification', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // hackathon_match, registration_deadline, work_verified, system
  title: text('title').notNull(),
  body: text('body'),
  linkUrl: text('link_url'),
  relatedHackathonId: text('related_hackathon_id')
    .references(() => hackathons.id, { onDelete: 'set null' }),
  isRead: boolean('is_read').default(false),
  emailSent: boolean('email_sent').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// ============ 社区精选内容 ============

export const articles = pgTable(
  'article',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    type: articleType('type').notNull(),
    coverImage: text('cover_image'),
    content: text('content').notNull(), // Markdown
    excerpt: text('excerpt'),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    authorBio: text('author_bio'),
    relatedHackathonId: text('related_hackathon_id')
      .references(() => hackathons.id, { onDelete: 'set null' }),
    tags: jsonb('tags').default(sql`'[]'::jsonb`),
    status: articleStatus('status').default('invited'),
    invitedBy: text('invited_by')
      .references(() => users.id, { onDelete: 'set null' }),
    invitedAt: timestamp('invited_at', { mode: 'date' }),
    submittedAt: timestamp('submitted_at', { mode: 'date' }),
    reviewedBy: text('reviewed_by')
      .references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
    reviewNotes: text('review_notes'),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    isFeatured: boolean('is_featured').default(false),
    viewCount: integer('view_count').default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex('article_slug_unique').on(table.slug),
  })
);

// ============ 私信会话 ============

export const conversations = pgTable(
  'conversation',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    participantA: text('participant_a')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    participantB: text('participant_b')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { mode: 'date' }).defaultNow(),
    lastMessagePreview: text('last_message_preview'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    participantsUnique: uniqueIndex('conversation_participants_unique').on(
      table.participantA,
      table.participantB
    ),
  })
);

// ============ 私信消息 ============

export const directMessages = pgTable('direct_message', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: messageType('type').default('text'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  status: messageStatus('status').default('sent'),
  isFromAgent: boolean('is_from_agent').default(false),
  agentId: text('agent_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ Agent Card ============

export const agentCards = pgTable('agent_card', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url'),
  version: text('version').default('1.0.0'),
  capabilities: jsonb('capabilities').default(sql`'[]'::jsonb`),
  skills: jsonb('skills').default(sql`'[]'::jsonb`),
  interests: jsonb('interests').default(sql`'[]'::jsonb`),
  preferredTracks: jsonb('preferred_tracks').default(sql`'[]'::jsonb`),
  isPublic: boolean('is_public').default(true),
  allowAgentContact: boolean('allow_agent_contact').default(true),
  autoNegotiate: boolean('auto_negotiate').default(false),
  negotiationRules: jsonb('negotiation_rules').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ A2A 协商 ============

export const a2aNegotiations = pgTable('a2a_negotiation', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  initiatorAgentId: text('initiator_agent_id')
    .notNull()
    .references(() => agentCards.id, { onDelete: 'cascade' }),
  responderAgentId: text('responder_agent_id')
    .notNull()
    .references(() => agentCards.id, { onDelete: 'cascade' }),
  hackathonId: text('hackathon_id')
    .references(() => hackathons.id, { onDelete: 'set null' }),
  status: negotiationStatus('status').default('proposed'),
  rounds: jsonb('rounds').default(sql`'[]'::jsonb`),
  finalProposal: jsonb('final_proposal'),
  resultTeamId: text('result_team_id')
    .references(() => agentTeams.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// ============ 邮箱订阅 ============

export const subscribers = pgTable('subscriber', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  source: text('source').default('homepage'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { mode: 'date' }),
});

// ============ 项目推荐 ============

export const projectRecommendations = pgTable(
  'project_recommendation',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    hackathonId: text('hackathon_id')
      .notNull()
      .references(() => hackathons.id, { onDelete: 'cascade' }),
    score: integer('score').default(0),
    reasons: jsonb('reasons').default(sql`'[]'::jsonb`),
    matchedTechStack: jsonb('matched_tech_stack').default(sql`'[]'::jsonb`),
    matchedTracks: jsonb('matched_tracks').default(sql`'[]'::jsonb`),
    isViewed: boolean('is_viewed').default(false),
    emailSent: boolean('email_sent').default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    projectHackathonUnique: uniqueIndex('project_recommendation_project_hackathon_unique').on(
      table.projectId,
      table.hackathonId
    ),
  })
);
