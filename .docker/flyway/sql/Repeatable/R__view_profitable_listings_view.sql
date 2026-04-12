DROP VIEW IF EXISTS public.profitable_listings;

CREATE OR REPLACE VIEW public.profitable_listings AS
WITH
  torn_listings AS (
    SELECT
      l.item_id,
      l.price           AS min_price,
      SUM(l.quantity)   AS quantity,
      MAX(l.time_seen)  AS last_updated
    FROM public.listings l
    JOIN (
      SELECT item_id, MIN(price) AS min_price
      FROM public.listings
      WHERE source = 'Torn'
      GROUP BY item_id
    ) m ON m.item_id = l.item_id AND l.price = m.min_price
    WHERE l.source = 'Torn'
    GROUP BY l.item_id, l.price
  ),
  weav3r_listings AS (
    SELECT
      l.item_id,
      l.price           AS min_price,
      SUM(l.quantity)   AS quantity,
      MAX(l.time_seen)  AS last_updated
    FROM public.listings l
    JOIN (
      SELECT item_id, MIN(price) AS min_price
      FROM public.listings
      WHERE source = 'Weav3r'
      GROUP BY item_id
    ) m ON m.item_id = l.item_id AND l.price = m.min_price
    WHERE l.source = 'Weav3r'
    GROUP BY l.item_id, l.price
  )
SELECT
  i.id                     AS item_id,
  i.name,
  i.is_found_in_city,
  CASE WHEN i.value_vendor_country = 'Torn'
       THEN i.value_buy_price
       ELSE NULL END        AS city_buy_price,
  i.value_sell_price       AS city_sell_price,
  i.value_market_price     AS market_price,
  tl.min_price             AS torn_min_price,
  tl.quantity::int         AS torn_quantity,
  tl.last_updated          AS torn_last_updated,
  wl.min_price             AS weav3r_min_price,
  wl.quantity::int         AS weav3r_quantity,
  wl.last_updated          AS weav3r_last_updated
FROM public.items i
LEFT JOIN torn_listings   tl ON tl.item_id = i.id
LEFT JOIN weav3r_listings wl ON wl.item_id = i.id
WHERE
  (
    tl.min_price IS NOT NULL
    AND (tl.min_price < i.value_sell_price OR tl.min_price < i.value_market_price)
  )
  OR (
    wl.min_price IS NOT NULL
    AND (wl.min_price < i.value_sell_price OR wl.min_price < i.value_market_price)
  );
