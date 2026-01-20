-- Add global SMTP configuration table
CREATE TABLE IF NOT EXISTS "global_smtp_config" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "smtp_host" text NOT NULL,
    "smtp_port" integer NOT NULL,
    "smtp_email" text NOT NULL,
    "smtp_password" text NOT NULL,
    "encryption_type" text NOT NULL,
    "sender_name" text,
    "reply_to" text,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key from global_smtp_config to user
ALTER TABLE "global_smtp_config" ADD CONSTRAINT "global_smtp_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- Add global_smtp_config_id column to groups table
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "global_smtp_config_id" text;
