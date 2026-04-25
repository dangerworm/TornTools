-- Bargain alerts (Drew-only v1). One row per distinct bargain event:
-- "a listing appeared on the Torn market whose single-unit profit
-- against the city sell-back price is > $5,000".
--
-- Idempotency: at most one active alert per item at any time. Enforced
-- by the partial unique index below so the application can INSERT
-- optimistically and rely on the DB to reject dupes; avoids races
-- between concurrent listings-processor workers.
--
-- Why track expired/dismissed rather than DELETE:
--   - The toast UI wants to transition "active" → "expired" in-place
--     (so the user sees "Too late!" rather than a silent disappearance).
--   - Cheap stats later ("alerts per day", "claim vs miss ratio") fall
--     out of this for free.
--
-- No user_id column. The authorised-recipient set is a config list
-- resolved at endpoint time; every row of this table is a global event
-- that any authorised user sees. When the subscription extension
-- eventually lands, this shape is still correct — the auth gate widens,
-- the row semantics don't change.
CREATE TABLE public.bargain_alerts (
    "id"              bigserial    PRIMARY KEY,
    "item_id"         int4         NOT NULL,
    "listing_price"   int8         NOT NULL,
    "market_value"    int8         NOT NULL,
    "profit"          int8         NOT NULL,
    "found_at"        timestamptz  NOT NULL DEFAULT NOW(),
    "expired_at"      timestamptz  NULL,
    "dismissed_at"    timestamptz  NULL,
    "status"          text         NOT NULL DEFAULT 'active',

    CONSTRAINT bargain_alerts_status_check
        CHECK (status IN ('active', 'expired', 'dismissed')),
    CONSTRAINT bargain_alerts_item_fk
        FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE
);

-- Hot-path index: the /api/alerts/active endpoint filters by status and
-- orders by recency.
CREATE INDEX IF NOT EXISTS idx_bargain_alerts_status_found
    ON public.bargain_alerts (status, found_at DESC);

-- Idempotency guard: at most one active alert per item. Partial so
-- historical rows (expired/dismissed) don't fight the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bargain_alerts_item_active
    ON public.bargain_alerts (item_id)
    WHERE status = 'active';
