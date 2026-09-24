CREATE TYPE "public"."room_visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "visibility" "room_visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE INDEX "rooms_visibility_idx" ON "rooms" USING btree ("visibility");
