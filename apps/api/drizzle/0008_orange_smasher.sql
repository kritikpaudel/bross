CREATE TABLE "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(180) NOT NULL,
	"email" varchar(254) NOT NULL,
	"normalized_email" varchar(254) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"account_status" "user_account_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_admin_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_sessions" ADD CONSTRAINT "platform_sessions_platform_admin_id_platform_admins_id_fk" FOREIGN KEY ("platform_admin_id") REFERENCES "public"."platform_admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_admins_email_unique" ON "platform_admins" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "platform_admins_status_idx" ON "platform_admins" USING btree ("account_status");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_sessions_token_hash_unique" ON "platform_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "platform_sessions_admin_idx" ON "platform_sessions" USING btree ("platform_admin_id");--> statement-breakpoint
CREATE INDEX "platform_sessions_expires_at_idx" ON "platform_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "platform_sessions_revoked_at_idx" ON "platform_sessions" USING btree ("revoked_at");