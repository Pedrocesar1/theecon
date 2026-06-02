-- Replace broad ALL policies (which include SELECT/listing) with write-only policies
DROP POLICY IF EXISTS "Authenticated manage covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated manage geojson" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated manage inline-images" ON storage.objects;

CREATE POLICY "Authenticated insert covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
CREATE POLICY "Authenticated update covers" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'covers') WITH CHECK (bucket_id = 'covers');
CREATE POLICY "Authenticated delete covers" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'covers');

CREATE POLICY "Authenticated insert geojson" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'geojson');
CREATE POLICY "Authenticated update geojson" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'geojson') WITH CHECK (bucket_id = 'geojson');
CREATE POLICY "Authenticated delete geojson" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'geojson');

CREATE POLICY "Authenticated insert inline-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inline-images');
CREATE POLICY "Authenticated update inline-images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'inline-images') WITH CHECK (bucket_id = 'inline-images');
CREATE POLICY "Authenticated delete inline-images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'inline-images');
