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

// ============ 枚举 ============

export const hackathonMode = pgEnum('hackathon_mode', ['online', 'offline', 'hybrid']);
export const hackathonStatus = pgEnum('hackathon_status', ['upcoming', 'ongoing', 'ended']);
export const participationRole = pgEnum('participation_role', [
  'participant',
  'winner',
  'organizer',
  'mentor',
  'judge',
]);
export const organizerStatus = pgEnum('organizer_status', ['pending', 'approved', 'rejected']);

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
    sponsors: jsonb('sponsors').default(sql`'[]'::jsonb`),
    status: hackathonStatus('status').default('upcoming'),
    participantCount: integer('participant_count').default(0),
    projectCount: integer('project_count').default(0),
    sourceUrl: text('source_url'),
    isVerified: boolean('is_verified').default(false),
    isFeatured: boolean('is_featured').default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
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
