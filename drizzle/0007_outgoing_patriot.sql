CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_name_snapshot" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_reference" text,
	"payment_url" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "price_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "currency" text DEFAULT 'IRR' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uidx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_provider_reference_idx" ON "orders" USING btree ("provider_reference");--> statement-breakpoint
UPDATE "plans" SET "price_amount" = 0, "currency" = 'IRR' WHERE "slug" = 'free';--> statement-breakpoint
UPDATE "plans" SET "price_amount" = 490000, "currency" = 'IRR' WHERE "slug" = 'starter';--> statement-breakpoint
UPDATE "plans" SET "price_amount" = 990000, "currency" = 'IRR' WHERE "slug" = 'pro';--> statement-breakpoint
UPDATE "plans" SET "price_amount" = 1990000, "currency" = 'IRR' WHERE "slug" = 'business';
