CREATE TYPE "public"."user_account_status" AS ENUM('pending', 'active', 'disabled', 'locked');--> statement-breakpoint
CREATE TABLE "employment_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" text,
	"allows_work_assignment" boolean DEFAULT true NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employment_period_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid,
	"email" varchar(254) NOT NULL,
	"normalized_email" varchar(254) NOT NULL,
	"password_hash" varchar(255),
	"account_status" "user_account_status" DEFAULT 'pending' NOT NULL,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employment_statuses" ADD CONSTRAINT "employment_statuses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_status_history" ADD CONSTRAINT "employee_status_history_employment_period_id_employment_periods_id_fk" FOREIGN KEY ("employment_period_id") REFERENCES "public"."employment_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_status_history" ADD CONSTRAINT "employee_status_history_status_id_employment_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."employment_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employment_statuses_org_name_unique" ON "employment_statuses" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_statuses_org_code_unique" ON "employment_statuses" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "employment_statuses_organization_idx" ON "employment_statuses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employee_status_history_period_idx" ON "employee_status_history" USING btree ("employment_period_id");--> statement-breakpoint
CREATE INDEX "employee_status_history_status_idx" ON "employee_status_history" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "employee_status_history_effective_from_idx" ON "employee_status_history" USING btree ("effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_status_history_one_open_status" ON "employee_status_history" USING btree ("employment_period_id") WHERE "employee_status_history"."effective_until" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_org_email_unique" ON "users" USING btree ("organization_id","normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_employee_unique" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "users_organization_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_account_status_idx" ON "users" USING btree ("account_status");