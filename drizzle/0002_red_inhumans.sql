ALTER TABLE "rooms" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "end_time" timestamp with time zone;--> statement-breakpoint
UPDATE "rooms"
SET
  "start_time" = COALESCE("start_time", "created_at"),
  "end_time" = COALESCE("end_time", "created_at" + interval '2 hours')
WHERE "start_time" IS NULL OR "end_time" IS NULL;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "start_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "end_time" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "rooms_start_time_idx" ON "rooms" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "rooms_end_time_idx" ON "rooms" USING btree ("end_time");
