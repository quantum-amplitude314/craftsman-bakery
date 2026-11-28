CREATE TABLE "visitor_count" (
	"until" timestamp with time zone PRIMARY KEY NOT NULL,
	"since" timestamp with time zone NOT NULL,
	"people" integer NOT NULL,
	"agents" integer NOT NULL,
	"bots" integer NOT NULL,
	CONSTRAINT "visitor_count_non_negative" CHECK ("visitor_count"."people" >= 0 and "visitor_count"."agents" >= 0 and "visitor_count"."bots" >= 0)
);
