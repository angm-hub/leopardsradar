-- Public bucket but no broad listing: drop our SELECT policy.
-- Storage object SELECT now requires either being the owner or
-- accessing via signed/public direct URL (which still works for public buckets).
DROP POLICY IF EXISTS "Public can read player photos" ON storage.objects;