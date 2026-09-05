CREATE TABLE "auction"."migration_legacy_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auction"."migration_legacy_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source_collection" text NOT NULL,
	"source_id" text NOT NULL,
	"reason" text NOT NULL,
	"record" jsonb NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "migration_legacy_records_source_id_idx" ON "auction"."migration_legacy_records" USING btree ("source_collection","source_id");--> statement-breakpoint
CREATE INDEX "migration_legacy_records_collection_idx" ON "auction"."migration_legacy_records" USING btree ("source_collection");