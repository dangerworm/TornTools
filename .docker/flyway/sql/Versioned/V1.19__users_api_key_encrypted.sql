-- At-rest encryption for Torn API keys. Stored as AES-GCM ciphertext with
-- the layout [1 byte version][12 byte nonce][16 byte tag][ciphertext], all
-- produced by ApiKeyProtector in the backend. The plaintext `api_key`
-- column stays for now — reads prefer this column, with plaintext as a
-- fallback during the backfill window. A follow-up migration drops the
-- plaintext column once every row is encrypted.

ALTER TABLE public.users
  ADD COLUMN api_key_encrypted BYTEA NULL;
