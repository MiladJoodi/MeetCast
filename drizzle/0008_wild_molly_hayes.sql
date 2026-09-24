ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "users_blocked_at_idx" ON "users" USING btree ("blocked_at");