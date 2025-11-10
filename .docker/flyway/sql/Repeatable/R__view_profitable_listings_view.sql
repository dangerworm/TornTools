DROP VIEW IF EXISTS public.profitable_listings;

CREATE OR REPLACE VIEW public.profitable_listings (
  item_id,
  name,
  min_price,
  max_price,
  sell_price,
  quantity,
  profit,
  last_updated
) AS
SELECT
  l.item_id,
  i.name,
  min(l.price) AS min_price,
  max(l.price) AS max_price,
  i.value_sell_price AS sell_price,
  sum(l.quantity) AS quantity,
  sum((i.value_sell_price - l.price) * l.quantity) AS profit,
  max(l.last_updated) AS last_updated
FROM
  public.items i
  JOIN public.listings l ON l.item_id = i.id
WHERE
  i.value_vendor_country = 'Torn'
  AND l.price < i.value_sell_price
GROUP BY
  l.item_id,
  i.name,
  i.value_sell_price
ORDER BY
  (sum((i.value_sell_price - l.price) * l.quantity)) DESC;