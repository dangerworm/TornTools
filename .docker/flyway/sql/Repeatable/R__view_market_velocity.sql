DROP VIEW IF EXISTS public.market_velocity;

CREATE OR REPLACE VIEW public.market_velocity AS
WITH
  change_counts AS (
    SELECT
      i.id AS item_id,
      i.name,
      COUNT(icl.id) AS times_changed,
      MIN(icl.new_price) AS min_price,
      MAX(icl.new_price) AS max_price
    FROM
      public.item_change_logs icl
      JOIN public.items i ON i.id = icl.item_id
    GROUP BY
      i.id,
      i.name
      ORDER BY
      	COUNT(icl.id) DESC
  )
SELECT
  cc.name,
  cc.times_changed,
  icl.new_price,
  icl.change_time
FROM
  change_counts cc
  JOIN public.item_change_logs icl ON icl.item_id = cc.item_id
ORDER BY
  cc.times_changed DESC,
  cc.name,
  icl.change_time;