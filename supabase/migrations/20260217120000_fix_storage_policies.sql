
-- Fix: The previous auth migration (20260217044241) added auth-restricted storage
-- policies but never dropped the old public ones from 20260216220850.
-- Since Postgres OR's RLS policies, the old permissive policies still allow
-- unauthenticated uploads and deletes. Drop them here.

-- Drop old permissive storage policies
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;

-- The correct policies from the auth migration already exist:
--   "Authenticated users can upload swing videos"  (INSERT, authenticated)
--   "Anyone can view swing videos"                 (SELECT, public)
--   "Authenticated users can delete swing videos"  (DELETE, authenticated)
