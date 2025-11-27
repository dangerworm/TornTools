CREATE TABLE IF NOT EXISTS public.themes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mode TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    secondary_color TEXT NOT NULL,
    user_id BIGINT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_theme_id BIGINT NULL REFERENCES public.themes(id);

INSERT INTO public.themes (name, mode, primary_color, secondary_color)
VALUES
    ('Default Light', 'light', '#1976d2', '#9c27b0'),
    ('Default Dark', 'dark', '#90caf9', '#ce93d8')
ON CONFLICT DO NOTHING;

UPDATE public.users
SET preferred_theme_id = COALESCE(
    preferred_theme_id,
    (SELECT id FROM public.themes WHERE name = 'Default Light' LIMIT 1)
);
