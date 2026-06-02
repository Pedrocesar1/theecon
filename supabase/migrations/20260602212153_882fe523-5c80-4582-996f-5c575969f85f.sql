-- Fix mutable search_path on trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop overly-broad listing policies on public buckets.
-- Public buckets still serve files via their public URLs without a SELECT policy;
-- removing these prevents clients from enumerating all files in the bucket.
DROP POLICY IF EXISTS "Public read covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read geojson" ON storage.objects;
DROP POLICY IF EXISTS "Public read inline-images" ON storage.objects;
