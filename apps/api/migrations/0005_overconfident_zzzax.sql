CREATE VIEW "public"."default_capacity" AS (select product_id, weekday, round(avg(baked) * 0.3)::int as capacity
  from (
    select "bake_history"."product_id", "bake_history"."baked", extract(isodow from "bake_history"."day")::int as weekday,
      row_number() over (partition by "bake_history"."product_id", extract(isodow from "bake_history"."day") order by "bake_history"."day" desc) as recency
    from "bake_history"
  ) recent
  where recency <= 4
  group by product_id, weekday);