ALTER TYPE "public"."user_account_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "archived_at" timestamp with time zone;