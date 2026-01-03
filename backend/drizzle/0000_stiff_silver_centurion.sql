CREATE TABLE "bulk_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"source_type" text NOT NULL,
	"total_records" integer NOT NULL,
	"successful" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"zip_filename" text,
	"zip_filepath" text,
	"zip_file_url" text,
	"zip_file_id" text,
	"errors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_code" text NOT NULL,
	"template_id" text NOT NULL,
	"recipient_name" text NOT NULL,
	"data" jsonb NOT NULL,
	"filename" text NOT NULL,
	"filepath" text NOT NULL,
	"file_url" text,
	"file_id" text,
	"generation_mode" text NOT NULL,
	"bulk_job_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_certificate_code_unique" UNIQUE("certificate_code")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filename" text NOT NULL,
	"filepath" text NOT NULL,
	"file_url" text,
	"file_id" text,
	"page_count" integer NOT NULL,
	"width" double precision NOT NULL,
	"height" double precision NOT NULL,
	"attributes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_bulk_job_id_bulk_jobs_id_fk" FOREIGN KEY ("bulk_job_id") REFERENCES "public"."bulk_jobs"("id") ON DELETE set null ON UPDATE no action;