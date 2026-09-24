CREATE TABLE "revoked_guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"guest_id" text NOT NULL,
	"revoked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revoked_guests" ADD CONSTRAINT "revoked_guests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "revoked_guests_room_guest_uidx" ON "revoked_guests" USING btree ("room_id","guest_id");--> statement-breakpoint
CREATE INDEX "revoked_guests_room_id_idx" ON "revoked_guests" USING btree ("room_id");