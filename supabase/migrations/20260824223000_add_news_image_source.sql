ALTER TABLE public.news
ADD COLUMN IF NOT EXISTS image_source text;

UPDATE public.news
SET image_source = 'Archivo'
WHERE image_source IS NULL OR btrim(image_source) = '';

ALTER TABLE public.news
ALTER COLUMN image_source SET DEFAULT 'Archivo';

ALTER TABLE public.news
ALTER COLUMN image_source SET NOT NULL;
