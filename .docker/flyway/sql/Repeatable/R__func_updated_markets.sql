DROP FUNCTION IF EXISTS public.updated_markets(integer);

CREATE OR REPLACE FUNCTION public.updated_markets(p_hours integer)
RETURNS TABLE (
  name          text,
  times_changed bigint,
  new_price     numeric,
  change_time   timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH change_counts AS (
    SELECT
      i.id AS item_id,
      i.name,
      COUNT(icl.id)        AS times_changed,
      MIN(icl.new_price)   AS min_price,
      MAX(icl.new_price)   AS max_price
    FROM
      public.item_change_logs icl
      JOIN public.items i ON i.id = icl.item_id
    WHERE
      icl.change_time >= now() - (p_hours || ' hours')::interval
    GROUP BY
      i.id,
      i.name
  )
  SELECT
    cc.name,
    cc.times_changed,
    icl.new_price,
    icl.change_time
  FROM
    change_counts cc
    JOIN public.item_change_logs icl ON icl.item_id = cc.item_id
  WHERE
    icl.change_time >= now() - (p_hours || ' hours')::interval
  ORDER BY
    cc.times_changed DESC,
    cc.name,
    icl.change_time;
$$;