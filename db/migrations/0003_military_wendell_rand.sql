ALTER TABLE "friends" ADD COLUMN "discord_id" text;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_discord_id_unique" UNIQUE("discord_id");