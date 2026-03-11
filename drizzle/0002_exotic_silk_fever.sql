CREATE TYPE "public"."agent_artifact_type" AS ENUM('analysis_report', 'idea_card', 'feasibility_matrix', 'task_board', 'timeline', 'resource_report', 'pitch_outline', 'demo_script', 'project_description', 'checklist', 'custom');--> statement-breakpoint
CREATE TYPE "public"."agent_message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."agent_session_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('p0', 'p1', 'p2');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'review', 'done', 'blocked');--> statement-breakpoint
CREATE TABLE "agent_analysis_report" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"hackathon_id" text,
	"tracks" jsonb DEFAULT '[]'::jsonb,
	"judging_criteria" jsonb DEFAULT '[]'::jsonb,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"time_allocation" jsonb DEFAULT '{}'::jsonb,
	"recommended_tracks" jsonb DEFAULT '[]'::jsonb,
	"strategy_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"team_id" text NOT NULL,
	"type" "agent_artifact_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"structured_data" jsonb,
	"version" integer DEFAULT 1,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" "agent_message_role" NOT NULL,
	"content" text NOT NULL,
	"user_id" text,
	"skill_name" text,
	"tool_calls" jsonb,
	"token_count" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_reminder" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text,
	"title" text NOT NULL,
	"message" text,
	"type" text DEFAULT 'custom',
	"remind_at" timestamp NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"triggered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_session" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"channel_type" text DEFAULT 'webchat',
	"channel_id" text,
	"status" "agent_session_status" DEFAULT 'active',
	"active_skill" text,
	"context_summary" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_task_board" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo',
	"priority" "task_priority" DEFAULT 'p1',
	"assignee_id" text,
	"estimated_hours" integer,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"module" text,
	"due_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_team_member" (
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member',
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_team_member_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "agent_team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hackathon_id" text,
	"hackathon_name" text,
	"created_by" text NOT NULL,
	"openclaw_session_id" text,
	"selected_track" text,
	"selected_idea" text,
	"anthropic_api_key" text,
	"openclaw_api_key" text,
	"llm_provider" text,
	"llm_api_key" text,
	"llm_base_url" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "beta_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agent_type" text NOT NULL,
	"feedback" text,
	"email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "draft_hackathon" (
	"id" text PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"platform" text,
	"scrape_log_id" text,
	"name" text,
	"short_name" text,
	"city" text,
	"country" text DEFAULT '中国',
	"venue" text,
	"date_range" text,
	"start_date" date,
	"end_date" date,
	"format" text,
	"theme" text,
	"summary" text,
	"prize_pool" text,
	"teams" text,
	"tracks" jsonb DEFAULT '[]'::jsonb,
	"agenda" jsonb DEFAULT '[]'::jsonb,
	"organizers" jsonb DEFAULT '[]'::jsonb,
	"sponsors" jsonb DEFAULT '[]'::jsonb,
	"confidence" integer,
	"raw_data" jsonb,
	"status" text DEFAULT 'pending',
	"reviewed_by" text,
	"review_notes" text,
	"published_hackathon_id" text,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scrape_log" (
	"id" text PRIMARY KEY NOT NULL,
	"target_id" text,
	"url" text NOT NULL,
	"platform" text,
	"status" text NOT NULL,
	"confidence" integer,
	"items_found" integer DEFAULT 0,
	"items_saved" integer DEFAULT 0,
	"error_message" text,
	"duration" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scrape_target" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"platform" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"schedule" text NOT NULL,
	"last_scraped_at" timestamp,
	"last_status" text,
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_prefs" jsonb DEFAULT '{"hackathonAlerts":true,"registrationReminders":true,"teamInvites":true,"systemAnnouncements":true,"emailNotifications":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_analysis_report" ADD CONSTRAINT "agent_analysis_report_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_analysis_report" ADD CONSTRAINT "agent_analysis_report_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_artifact" ADD CONSTRAINT "agent_artifact_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_artifact" ADD CONSTRAINT "agent_artifact_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_message" ADD CONSTRAINT "agent_message_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_message" ADD CONSTRAINT "agent_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_reminder" ADD CONSTRAINT "agent_reminder_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_reminder" ADD CONSTRAINT "agent_reminder_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_task_board" ADD CONSTRAINT "agent_task_board_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_task_board" ADD CONSTRAINT "agent_task_board_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team_member" ADD CONSTRAINT "agent_team_member_team_id_agent_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team_member" ADD CONSTRAINT "agent_team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team" ADD CONSTRAINT "agent_team_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team" ADD CONSTRAINT "agent_team_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beta_request" ADD CONSTRAINT "beta_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_hackathon" ADD CONSTRAINT "draft_hackathon_scrape_log_id_scrape_log_id_fk" FOREIGN KEY ("scrape_log_id") REFERENCES "public"."scrape_log"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_hackathon" ADD CONSTRAINT "draft_hackathon_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_hackathon" ADD CONSTRAINT "draft_hackathon_published_hackathon_id_hackathon_id_fk" FOREIGN KEY ("published_hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_log" ADD CONSTRAINT "scrape_log_target_id_scrape_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."scrape_target"("id") ON DELETE set null ON UPDATE no action;