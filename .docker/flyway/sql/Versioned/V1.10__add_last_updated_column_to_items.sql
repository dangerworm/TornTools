ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS last_updated timestamptz NOT NULL DEFAULT now();
