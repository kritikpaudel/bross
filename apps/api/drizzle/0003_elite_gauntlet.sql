CREATE TABLE "employment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(30),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employment_types" ADD CONSTRAINT "employment_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employment_types_org_name_unique" ON "employment_types" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_types_org_code_unique" ON "employment_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "employment_types_organization_idx" ON "employment_types" USING btree ("organization_id");