ALTER TABLE public.indexes
  ADD COLUMN IF NOT EXISTS geojson_url text,
  ADD COLUMN IF NOT EXISTS join_key text DEFAULT 'code';