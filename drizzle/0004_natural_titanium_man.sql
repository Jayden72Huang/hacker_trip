ALTER TABLE "hackathon" ADD COLUMN "short_name" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "country" text DEFAULT '中国';--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "theme" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "teams" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "brief" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "host_organizer" text;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "agenda" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "registration" jsonb;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "info_cards" jsonb;--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "organizers" jsonb DEFAULT '[]'::jsonb;