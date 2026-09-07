CREATE TABLE "designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid,
	"name" varchar(120) NOT NULL,
	"code" varchar(40),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "designations_org_code_unique" ON "designations" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "designations_organization_idx" ON "designations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "designations_department_idx" ON "designations" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "designations_name_idx" ON "designations" USING btree ("name");