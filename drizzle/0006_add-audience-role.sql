ALTER TYPE "public"."participation_role" ADD VALUE 'audience';--> statement-breakpoint
CREATE TABLE "subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'homepage',
	"created_at" timestamp DEFAULT now(),
	"unsubscribed_at" timestamp,
	CONSTRAINT "subscriber_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "hackathon" ADD COLUMN "is_published" boolean DEFAULT true NOT NULL;