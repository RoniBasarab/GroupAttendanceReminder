CREATE TYPE "public"."exception_kind" AS ENUM('extra', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."form_kind" AS ENUM('morning', 'evening');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."push_platform" AS ENUM('android', 'web');--> statement-breakpoint
CREATE TABLE "form_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"kind" "form_kind" NOT NULL,
	"title" text NOT NULL,
	"form_response_url" text NOT NULL,
	"first_name_field" text NOT NULL,
	"last_name_field" text NOT NULL,
	"lessons" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"join_code" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"device_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_device_token_hash_unique" UNIQUE("device_token_hash")
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"platform" "push_platform" NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reminder_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"study_date" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"date" date NOT NULL,
	"exception" "exception_kind" NOT NULL,
	"kind" "form_kind"
);
--> statement-breakpoint
CREATE TABLE "weekly_study_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"kind" "form_kind" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_configs" ADD CONSTRAINT "form_configs_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_study_days" ADD CONSTRAINT "weekly_study_days_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "form_configs_group_kind_idx" ON "form_configs" USING btree ("group_id","kind");--> statement-breakpoint
CREATE INDEX "members_group_idx" ON "members" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_group_email_idx" ON "members" USING btree ("group_id","email");--> statement-breakpoint
CREATE INDEX "push_tokens_member_idx" ON "push_tokens" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_group_date_idx" ON "reminder_log" USING btree ("group_id","study_date");--> statement-breakpoint
CREATE UNIQUE INDEX "exceptions_group_date_idx" ON "schedule_exceptions" USING btree ("group_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_group_weekday_idx" ON "weekly_study_days" USING btree ("group_id","weekday");