DELETE FROM "purchase_participants" WHERE "friend_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "purchase_participants" ALTER COLUMN "friend_id" SET NOT NULL;
