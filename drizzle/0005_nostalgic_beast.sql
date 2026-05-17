CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'team_invite', 'team_request', 'agent_negotiation', 'system');--> statement-breakpoint
CREATE TYPE "public"."negotiation_status" AS ENUM('proposed', 'counter_proposed', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "a2a_negotiation" (
	"id" text PRIMARY KEY NOT NULL,
	"initiator_agent_id" text NOT NULL,
	"responder_agent_id" text NOT NULL,
	"hackathon_id" text,
	"status" "negotiation_status" DEFAULT 'proposed',
	"rounds" jsonb DEFAULT '[]'::jsonb,
	"final_proposal" jsonb,
	"result_team_id" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text,
	"version" text DEFAULT '1.0.0',
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"interests" jsonb DEFAULT '[]'::jsonb,
	"preferred_tracks" jsonb DEFAULT '[]'::jsonb,
	"is_public" boolean DEFAULT true,
	"allow_agent_contact" boolean DEFAULT true,
	"auto_negotiate" boolean DEFAULT false,
	"negotiation_rules" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_card_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_a" text NOT NULL,
	"participant_b" text NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"last_message_preview" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_participants_unique" ON "conversation" USING btree ("participant_a","participant_b");--> statement-breakpoint
CREATE TABLE "direct_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"type" "message_type" DEFAULT 'text',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "message_status" DEFAULT 'sent',
	"is_from_agent" boolean DEFAULT false,
	"agent_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_recommendation" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"hackathon_id" text NOT NULL,
	"score" integer DEFAULT 0,
	"reasons" jsonb DEFAULT '[]'::jsonb,
	"matched_tech_stack" jsonb DEFAULT '[]'::jsonb,
	"matched_tracks" jsonb DEFAULT '[]'::jsonb,
	"is_viewed" boolean DEFAULT false,
	"email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_recommendation_project_hackathon_unique" ON "project_recommendation" USING btree ("project_id","hackathon_id");--> statement-breakpoint
ALTER TABLE "draft_hackathon" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "agent_mode_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "agent_visibility" jsonb DEFAULT '{"skills":true,"interests":true,"lookingForTeam":true,"experienceLevel":true,"projects":false,"participations":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "a2a_negotiation" ADD CONSTRAINT "a2a_negotiation_initiator_agent_id_agent_card_id_fk" FOREIGN KEY ("initiator_agent_id") REFERENCES "public"."agent_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_negotiation" ADD CONSTRAINT "a2a_negotiation_responder_agent_id_agent_card_id_fk" FOREIGN KEY ("responder_agent_id") REFERENCES "public"."agent_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_negotiation" ADD CONSTRAINT "a2a_negotiation_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_negotiation" ADD CONSTRAINT "a2a_negotiation_result_team_id_agent_team_id_fk" FOREIGN KEY ("result_team_id") REFERENCES "public"."agent_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_card" ADD CONSTRAINT "agent_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_participant_a_user_id_fk" FOREIGN KEY ("participant_a") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_participant_b_user_id_fk" FOREIGN KEY ("participant_b") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_recommendation" ADD CONSTRAINT "project_recommendation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_recommendation" ADD CONSTRAINT "project_recommendation_hackathon_id_hackathon_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_hackathon" ADD CONSTRAINT "draft_hackathon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon" ADD CONSTRAINT "hackathon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
