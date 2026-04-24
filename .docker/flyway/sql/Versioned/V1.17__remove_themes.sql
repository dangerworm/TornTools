ALTER TABLE public.users
DROP COLUMN IF EXISTS preferred_theme_id;

DROP TABLE IF EXISTS public.themes;
