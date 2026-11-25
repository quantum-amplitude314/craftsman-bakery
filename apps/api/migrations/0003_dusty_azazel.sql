CREATE TABLE "bake_history" (
	"product_id" uuid NOT NULL,
	"day" date NOT NULL,
	"baked" integer NOT NULL,
	CONSTRAINT "bake_history_product_id_day_pk" PRIMARY KEY("product_id","day"),
	CONSTRAINT "bake_history_baked_non_negative" CHECK ("bake_history"."baked" >= 0)
);
--> statement-breakpoint
ALTER TABLE "bake_history" ADD CONSTRAINT "bake_history_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;