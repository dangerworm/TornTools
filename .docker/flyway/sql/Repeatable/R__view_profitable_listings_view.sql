DROP VIEW IF EXISTS public.profitable_listings;

CREATE OR REPLACE VIEW public.profitable_listings AS
WITH
  torn_timestamps AS (
    SELECT item_id, MAX(time_seen) AS last_updated
    FROM public.listings
    WHERE source = 'Torn'
    GROUP BY item_id
  ),
  weav3r_base AS (
    SELECT item_id, MIN(price) AS min_price, MAX(time_seen) AS last_updated
    FROM public.listings
    WHERE source = 'Weav3r'
      AND price > 0
      AND quantity > 0
    GROUP BY item_id
  ),
  -- Market listings profitable vs city sell (price < value_sell_price)
  market_vs_city AS (
    SELECT
      l.item_id,
      MIN(l.price)                                              AS min_price,
      MAX(l.price)                                              AS max_price,
      SUM(l.quantity)                                           AS quantity,
      SUM((i.value_sell_price - l.price)::numeric * l.quantity) AS total_profit
    FROM public.listings l
    JOIN public.items i ON i.id = l.item_id
    WHERE l.source = 'Torn'
      AND l.price > 0
      AND l.quantity > 0
      AND i.value_sell_price IS NOT NULL
      AND l.price < i.value_sell_price
    GROUP BY l.item_id
  ),
  -- Market listings profitable vs bazaar sell (price < Weav3r global min price)
  market_vs_bazaar AS (
    SELECT
      l.item_id,
      MIN(l.price)                                              AS min_price,
      MAX(l.price)                                              AS max_price,
      SUM(l.quantity)                                           AS quantity,
      SUM((wb.min_price - l.price)::numeric * l.quantity)       AS total_profit
    FROM public.listings l
    JOIN weav3r_base wb ON wb.item_id = l.item_id
    WHERE l.source = 'Torn'
      AND l.price > 0
      AND l.quantity > 0
      AND l.price < wb.min_price
    GROUP BY l.item_id
  ),
  -- Weav3r listings profitable vs city sell (price < value_sell_price)
  weav3r_vs_city AS (
    SELECT
      l.item_id,
      MIN(l.price)                                              AS min_price,
      MAX(l.price)                                              AS max_price,
      SUM(l.quantity)                                           AS quantity,
      SUM((i.value_sell_price - l.price)::numeric * l.quantity) AS total_profit
    FROM public.listings l
    JOIN public.items i ON i.id = l.item_id
    WHERE l.source = 'Weav3r'
      AND l.price > 0
      AND l.quantity > 0
      AND i.value_sell_price IS NOT NULL
      AND l.price < i.value_sell_price
    GROUP BY l.item_id
  ),
  -- Weav3r listings profitable vs market sell (price < FLOOR(value_market_price * 0.95))
  weav3r_vs_market AS (
    SELECT
      l.item_id,
      MIN(l.price)                                                               AS min_price,
      MAX(l.price)                                                               AS max_price,
      SUM(l.quantity)                                                            AS quantity,
      SUM((FLOOR(i.value_market_price * 0.95) - l.price)::numeric * l.quantity) AS total_profit
    FROM public.listings l
    JOIN public.items i ON i.id = l.item_id
    WHERE l.source = 'Weav3r'
      AND l.price > 0
      AND l.quantity > 0
      AND i.value_market_price IS NOT NULL
      AND l.price < FLOOR(i.value_market_price * 0.95)
    GROUP BY l.item_id
  ),
  -- Weav3r listings profitable vs anonymous market sell (price < FLOOR(value_market_price * 0.85))
  weav3r_vs_anon AS (
    SELECT
      l.item_id,
      MIN(l.price)                                                               AS min_price,
      MAX(l.price)                                                               AS max_price,
      SUM(l.quantity)                                                            AS quantity,
      SUM((FLOOR(i.value_market_price * 0.85) - l.price)::numeric * l.quantity) AS total_profit
    FROM public.listings l
    JOIN public.items i ON i.id = l.item_id
    WHERE l.source = 'Weav3r'
      AND l.price > 0
      AND l.quantity > 0
      AND i.value_market_price IS NOT NULL
      AND l.price < FLOOR(i.value_market_price * 0.85)
    GROUP BY l.item_id
  )
SELECT
  i.id                              AS item_id,
  i.name,
  i.is_found_in_city,
  CASE WHEN i.value_vendor_country = 'Torn'
       THEN i.value_buy_price
       ELSE NULL END                AS city_buy_price,
  i.value_sell_price                AS city_sell_price,
  i.value_market_price              AS market_price,

  mvc.min_price                      AS torn_city_min_price,
  mvc.max_price                      AS torn_city_max_price,
  mvc.quantity                       AS torn_city_quantity,
  mvc.total_profit                   AS torn_city_total_profit,

  mvb.min_price                      AS torn_bazaar_min_price,
  mvb.max_price                      AS torn_bazaar_max_price,
  mvb.quantity                       AS torn_bazaar_quantity,
  mvb.total_profit                   AS torn_bazaar_total_profit,

  tt.last_updated                   AS torn_last_updated,

  wb.min_price                      AS weav3r_global_min_price,

  wvc.min_price                      AS weav3r_city_min_price,
  wvc.max_price                      AS weav3r_city_max_price,
  wvc.quantity                       AS weav3r_city_quantity,
  wvc.total_profit                   AS weav3r_city_total_profit,

  wvm.min_price                      AS weav3r_market_min_price,
  wvm.max_price                      AS weav3r_market_max_price,
  wvm.quantity                       AS weav3r_market_quantity,
  wvm.total_profit                   AS weav3r_market_total_profit,

  wva.min_price                      AS weav3r_anon_min_price,
  wva.max_price                      AS weav3r_anon_max_price,
  wva.quantity                       AS weav3r_anon_quantity,
  wva.total_profit                   AS weav3r_anon_total_profit,

  wb.last_updated                   AS weav3r_last_updated

FROM public.items i
LEFT JOIN torn_timestamps     tt    ON tt.item_id = i.id
LEFT JOIN weav3r_base         wb    ON wb.item_id = i.id
LEFT JOIN market_vs_city      mvc   ON mvc.item_id = i.id
LEFT JOIN market_vs_bazaar    mvb   ON mvb.item_id = i.id
LEFT JOIN weav3r_vs_city      wvc    ON wvc.item_id = i.id
LEFT JOIN weav3r_vs_market    wvm    ON wvm.item_id = i.id
LEFT JOIN weav3r_vs_anon      wva    ON wva.item_id = i.id
WHERE
  mvc.item_id IS NOT NULL
  OR mvb.item_id IS NOT NULL
  OR wvc.item_id IS NOT NULL
  OR wvm.item_id IS NOT NULL
  OR wva.item_id IS NOT NULL;
