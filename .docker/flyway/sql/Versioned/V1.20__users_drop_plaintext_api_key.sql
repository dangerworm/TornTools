-- Phase 3 cleanup: Phase 1 encrypted every row into api_key_encrypted and
-- Phase 2 stopped the browser from ever seeing the plaintext after sign-in.
-- Dropping the legacy column now that reads and writes go exclusively
-- through api_key_encrypted.
--
-- PRECONDITION: every users row must have api_key_encrypted IS NOT NULL
-- before this runs. Verify in prod with:
--     SELECT COUNT(*) FROM public.users
--     WHERE api_key_encrypted IS NULL AND api_key IS NOT NULL AND api_key <> '';
-- If the count is non-zero, STOP — the backfill hasn't finished.

ALTER TABLE public.users
  DROP COLUMN api_key;
