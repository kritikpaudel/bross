CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_number" varchar(50) NOT NULL,
	"full_name" varchar(180) NOT NULL,
	"preferred_name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"notice_submitted_on" date,
	"last_working_day" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"department_id" uuid,
	"team_id" uuid,
	"designation_id" uuid,
	"hierarchy_level_id" uuid,
	"employment_type_id" uuid,
	"reports_to_employee_id" uuid,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"change_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_periods" ADD CONSTRAINT "employment_periods_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_hierarchy_level_id_hierarchy_levels_id_fk" FOREIGN KEY ("hierarchy_level_id") REFERENCES "public"."hierarchy_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employment_type_id_employment_types_id_fk" FOREIGN KEY ("employment_type_id") REFERENCES "public"."employment_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_reports_to_employee_id_employees_id_fk" FOREIGN KEY ("reports_to_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_org_employee_number_unique" ON "employees" USING btree ("organization_id","employee_number");--> statement-breakpoint
CREATE INDEX "employees_organization_idx" ON "employees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_full_name_idx" ON "employees" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "employment_periods_employee_idx" ON "employment_periods" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employment_periods_started_on_idx" ON "employment_periods" USING btree ("started_on");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_periods_one_open_period" ON "employment_periods" USING btree ("employee_id") WHERE "employment_periods"."ended_on" IS NULL;--> statement-breakpoint
CREATE INDEX "employee_assignments_employee_idx" ON "employee_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_department_idx" ON "employee_assignments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_team_idx" ON "employee_assignments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_designation_idx" ON "employee_assignments" USING btree ("designation_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_hierarchy_idx" ON "employee_assignments" USING btree ("hierarchy_level_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_manager_idx" ON "employee_assignments" USING btree ("reports_to_employee_id");--> statement-breakpoint
CREATE INDEX "employee_assignments_effective_from_idx" ON "employee_assignments" USING btree ("effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_assignments_one_open_assignment" ON "employee_assignments" USING btree ("employee_id") WHERE "employee_assignments"."effective_until" IS NULL;