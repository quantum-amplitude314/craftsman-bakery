CREATE TABLE "capacity" (
	"product_id" uuid NOT NULL,
	"pickup_day" date NOT NULL,
	"capacity" integer NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "capacity_product_id_pickup_day_pk" PRIMARY KEY("product_id","pickup_day"),
	CONSTRAINT "capacity_reserved_within" CHECK (0 <= "capacity"."reserved" and "capacity"."reserved" <= "capacity"."capacity")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "product_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"code" text PRIMARY KEY NOT NULL,
	"pickup_day" date NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_item" (
	"reservation_code" text NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "reservation_item_reservation_code_product_id_pk" PRIMARY KEY("reservation_code","product_id"),
	CONSTRAINT "reservation_item_quantity_positive" CHECK ("reservation_item"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "capacity" ADD CONSTRAINT "capacity_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_item" ADD CONSTRAINT "reservation_item_reservation_code_reservation_code_fk" FOREIGN KEY ("reservation_code") REFERENCES "public"."reservation"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_item" ADD CONSTRAINT "reservation_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;