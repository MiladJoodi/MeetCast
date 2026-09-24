UPDATE "rooms" SET "visibility" = 'private' WHERE "id" IN (SELECT DISTINCT "room_id" FROM "room_allowed_emails") AND "visibility" = 'public';
