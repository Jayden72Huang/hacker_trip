CREATE TYPE "public"."hackathon_mode" AS ENUM('online', 'offline', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."hackathon_status" AS ENUM('upcoming', 'ongoing', 'ended');--> statement-breakpoint
CREATE TYPE "public"."participation_role" AS ENUM('participant', 'winner', 'organizer', 'mentor', 'judge');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"user_id" text NOT NULL,
	"hackathon_id" text NOT NULL,
	"notify_me" boolean DEFAULT true,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bookmark_user_id_hackathon_id_pk" PRIMARY KEY("user_id","hackathon_id")
);
--> statement-breakpoint
CREATE TABLE "hackathon" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"cover_image" text,
	"website" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"registration_deadline" date,
	"mode" "hackathon_mode" DEFAULT 'hybrid',
	"location" text,
	"timezone" text DEFAULT 'UTC',
	"tracks" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"tech_stack" jsonb DEFAULT '[]'::jsonb,
	"prize_pool" text,
	"prizes" jsonb DEFAULT '[]'::jsonb,
	"organizer" text,
	"sponsors" jsonb DEFAULT '[]'::jsonb,
	"status" "hackathon_status" DEFAULT 'upcoming',
	"participant_count" integer DEFAULT 0,
	"project_count" integer DEFAULT 0,
	"source_url" text,
	"is_verified" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hackathon_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "participation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hackathon_id" text,
	"hackathon_name" text,
	"hackathon_logo" text,
	"role" "participation_role" DEFAULT 'participant',
	"team_name" text,
	"placement" text,
	"track" text,
	"project_id" text,
	"date_range" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hackathon_id" text,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"cover_image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"demo_url" text,
	"repo_url" text,
	"video_url" text,
	"devpost_url" text,
	"tech_stack" jsonb DEFAULT '[]'::jsonb,
	"tracks" jsonb DEFAULT '[]'::jsonb,
	"awards" jsonb DEFAULT '[]'::jsonb,
	"hackathon_name" text,
	"is_public" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hackathon_id" text NOT NULL,
	"score" integer DEFAULT 0,
	"reasons" jsonb DEFAULT '[]'::jsonb,
	"matched_skills" jsonb DEFAULT '[]'::jsonb,
	"matched_interests" jsonb DEFAULT '[]'::jsonb,
	"is_viewed" boolean DEFAULT false,
	"is_clicked" boolean DEFAULT false,
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teammate" (
	"participation_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"avatar" text,
	"role" text,
	"github" text,
	"linkedin" text,
	CONSTRAINT "teammate_participation_id_name_pk" PRIMARY KEY("participation_id","name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" text DEFAULT 'user',
	"username" text,
	"bio" text,
	"location" text,
	"github" text,
	"twitter" text,
	"linkedin" text,
	"website" text,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"interests" jsonb DEFAULT '[]'::jsonb,
	"preferred_tracks" jsonb DEFAULT '[]'::jsonb,
	"experience_level" text DEFAULT 'beginner',
	"looking_for_team" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation" ADD CONSTRAINT "participation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation" ADD CONSTRAINT "participation_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation" ADD CONSTRAINT "participation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teammate" ADD CONSTRAINT "teammate_participation_id_participation_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."participation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teammate" ADD CONSTRAINT "teammate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;