CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"max_concurrent_participants" integer NOT NULL,
	"max_room_duration_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "plans_slug_uidx" ON "plans" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "plans_is_active_idx" ON "plans" USING btree ("is_active");
--> statement-breakpoint
INSERT INTO "plans" ("name", "slug", "description", "max_concurrent_participants", "max_room_duration_minutes", "is_active")
VALUES
	('Free', 'free', 'Starter plan for individuals.', 5, 60, true),
	('Starter', 'starter', 'For small teams.', 10, 120, true),
	('Pro', 'pro', 'For growing organizations.', 25, 240, true),
	('Business', 'business', 'Highest limits within platform technical constraints.', 50, NULL, true)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_id" uuid;
--> statement-breakpoint
UPDATE "users"
SET "plan_id" = (SELECT "id" FROM "plans" WHERE "slug" = 'free' LIMIT 1)
WHERE "plan_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "users_plan_id_idx" ON "users" USING btree ("plan_id");
