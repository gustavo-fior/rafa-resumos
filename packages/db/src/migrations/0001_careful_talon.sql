CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'refunded', 'disputed', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('abacatepay');--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"provider" "payment_provider" DEFAULT 'abacatepay' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_cents" integer NOT NULL,
	"provider_charge_id" text,
	"provider_status" text,
	"payment_method" text DEFAULT 'PIX' NOT NULL,
	"receipt_url" text,
	"br_code" text,
	"br_code_base64" text,
	"payment_expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"raw_provider_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "payment_provider" DEFAULT 'abacatepay' NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"raw_payload" text NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_provider_charge_id_unique" ON "order" USING btree ("provider_charge_id");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_product_id_idx" ON "order" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_event_provider_event_unique" ON "webhook_event" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_event" USING btree ("event_type");