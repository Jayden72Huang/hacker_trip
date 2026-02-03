CREATE TYPE "public"."organizer_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "organizer_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_name" text NOT NULL,
	"website" text,
	"role" text NOT NULL,
	"status" "organizer_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	CONSTRAINT "organizer_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "hackathon" DROP CONSTRAINT "hackathon_slug_unique";--> statement-breakpoint
ALTER TABLE "organizer_profile" ADD CONSTRAINT "organizer_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_slug_unique" ON "hackathon" USING btree ("slug");