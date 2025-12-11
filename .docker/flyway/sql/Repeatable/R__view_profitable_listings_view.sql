DROP VIEW IF EXISTS public.profitable_listings;

CREATE OR REPLACE VIEW public.profitable_listings (
  item_id,
  "name",
  min_price,
  max_price,
  quantity,
  total_cost,
  city_price,
  market_price,
  last_updated
) AS
SELECT
  l.item_id,
  i.name,
  min(l.price) AS min_price,
  max(l.price) AS max_price,
  sum(l.quantity) AS quantity,
  sum(l.price * l.quantity) AS total_cost,
  i.value_sell_price AS city_price,
  i.value_market_price AS market_price,
  max(l.time_seen) AS last_updated
FROM
  public.items i
  JOIN public.listings l ON l.item_id = i.id
WHERE
  i.id <> 335
	AND (l.price < i.value_sell_price OR l.price < i.value_market_price)
GROUP BY
  i.name,
  i.value_sell_price,
  i.value_market_price,
  l.item_id;
