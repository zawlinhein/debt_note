ALTER TABLE "purchase_participants" DROP CONSTRAINT "purchase_participants_purchase_id_friend_id_pk";--> statement-breakpoint
ALTER TABLE "purchase_participants" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_purchase_participant" ON "purchase_participants" USING btree ("purchase_id","friend_id");