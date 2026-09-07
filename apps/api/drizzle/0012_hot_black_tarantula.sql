DROP INDEX "users_org_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("normalized_email");