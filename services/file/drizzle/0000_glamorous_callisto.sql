CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"s3_key" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"mime_type" varchar(100),
	"size_bytes" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "files_s3_key_unique" UNIQUE("s3_key")
);
