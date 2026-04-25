-- Bargain alerts — synthetic verification helpers.
--
-- Once the V1.25 migration has applied (it will on next backend boot),
-- these queries let you simulate a bargain end-to-end without waiting
-- for the real Torn market to throw something cheap.
--
-- Pick any tradable item with a non-null value_sell_price. Cheapish,
-- well-known items work best (e.g. Xanax id=206).

-- 1. Find a candidate item to fake an alert against:
SELECT id, name, value_sell_price
FROM public.items
WHERE value_sell_price IS NOT NULL
  AND value_sell_price > 50000
  AND is_tradable = true
ORDER BY value_sell_price DESC
LIMIT 5;

-- 2. Open a synthetic alert directly against the table.
--    Replace :item_id and :sell_price with values from step 1.
--
-- This bypasses the listings-write hook entirely. Useful for testing
-- the toast UI / polling path without poking listings. The toast
-- should appear on the next 12s poll cycle.
INSERT INTO public.bargain_alerts (item_id, listing_price, market_value, profit, status)
VALUES (
  /* :item_id    */ 206,
  /* listing    */ 1,
  /* :sell_price */ 800,
  /* profit     */ 799,
  'active'
);

-- 3. To exercise the detection hook end-to-end (more thorough), insert
--    a sub-threshold listing into public.listings for the chosen item.
--    The next time TornMarketsProcessor scans that item the
--    EvaluateAsync hook will run; if our listing is cheaper than the
--    threshold, an alert opens. Note: the detection only runs when
--    the listings actually change, so the insert needs to displace
--    the existing minimum.
--
-- Replace :item_id, :sell_price; price = sell_price - 6000 puts profit
-- well over the $5,000 threshold.
--
-- (You may also need to delete other rows for the item so this becomes
-- the cheapest, depending on existing data.)
INSERT INTO public.listings (
  correlation_id, source, item_id, listing_position, price, quantity, time_seen
)
VALUES (
  gen_random_uuid(), 'Torn', 206, 0, 100, 1, NOW()
);

-- 4. Inspect what's active.
SELECT id, item_id, listing_price, market_value, profit, found_at, status
FROM public.bargain_alerts
WHERE status = 'active'
ORDER BY found_at DESC;

-- 5. Manually expire (simulates the listing being sold and the next
--    scan finding nothing under threshold).
UPDATE public.bargain_alerts
SET status = 'expired', expired_at = NOW()
WHERE id = /* :alert_id */ 1;

-- 6. Cleanup after testing.
DELETE FROM public.bargain_alerts WHERE status IN ('expired', 'dismissed');
