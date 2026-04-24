-- Phase 3 cleanup: Phase 1 encrypted every row into api_key_encrypted and
-- Phase 2 stopped the browser from ever seeing the plaintext after sign-in.
-- Dropping the legacy column now that reads and writes go exclusively
-- through api_key_encrypted.
--
-- The guard below refuses to run if any user row still has a plaintext
-- api_key but no api_key_encrypted — dropping the column in that state
-- would irreversibly lose the only recoverable key material for those
-- users. The CI pipeline runs `flyway migrate` automatically, so the
-- check needs to be inside the migration, not documentation.

DO $$
DECLARE
  unencrypted_rows bigint;
BEGIN
  SELECT COUNT(*) INTO unencrypted_rows
  FROM public.users
  WHERE api_key_encrypted IS NULL
    AND api_key IS NOT NULL
    AND api_key <> '';

  IF unencrypted_rows > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop users.api_key: % row(s) still lack api_key_encrypted. '
      'The Phase 1 backfill has not completed for every row — deploy the '
      'backfill, wait for it to run, and re-deploy this migration.',
      unencrypted_rows;
  END IF;
END $$;

ALTER TABLE public.users
  DROP COLUMN api_key;
