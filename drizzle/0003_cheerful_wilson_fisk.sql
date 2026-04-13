CREATE TYPE "public"."article_status" AS ENUM('invited', 'draft', 'in_review', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."article_type" AS ENUM('experience', 'interview', 'guest_post');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('draft', 'pending', 'ai_reviewed', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"tier" text DEFAULT 'free',
	"rate_limit_rpm" integer DEFAULT 30,
	"rate_limit_rpd" integer DEFAULT 500,
	"scopes" jsonb DEFAULT '["read"]'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"request_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"type" "article_type" NOT NULL,
	"cover_image" text,
	"content" text NOT NULL,
	"excerpt" text,
	"author_id" text NOT NULL,
	"author_bio" text,
	"related_hackathon_id" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" "article_status" DEFAULT 'invited',
	"invited_by" text,
	"invited_at" timestamp,
	"submitted_at" timestamp,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"published_at" timestamp,
	"is_featured" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link_url" text,
	"related_hackathon_id" text,
	"is_read" boolean DEFAULT false,
	"email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"role" text,
	"avatar" text,
	"github" text,
	"linkedin" text
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "external_hackathon_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "verification_status" "verification_status" DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ai_confidence_score" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ai_review_result" jsonb;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ai_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "admin_reviewer_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "admin_review_notes" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "admin_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "role_in_project" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "screenshots" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "video_key" text;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_related_hackathon_id_hackathon_id_fk" FOREIGN KEY ("related_hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_related_hackathon_id_hackathon_id_fk" FOREIGN KEY ("related_hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_log" ADD CONSTRAINT "verification_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_log" ADD CONSTRAINT "verification_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_team_member" ADD CONSTRAINT "work_team_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_team_member" ADD CONSTRAINT "work_team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_slug_unique" ON "article" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_admin_reviewer_id_user_id_fk" FOREIGN KEY ("admin_reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;