CREATE TABLE "room_allowed_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_allowed_emails" ADD CONSTRAINT "room_allowed_emails_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_allowed_emails_room_email_uidx" ON "room_allowed_emails" USING btree ("room_id","email");--> statement-breakpoint
CREATE INDEX "room_allowed_emails_room_id_idx" ON "room_allowed_emails" USING btree ("room_id");