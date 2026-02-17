
-- Drop existing restrictive policies on players
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;
DROP POLICY IF EXISTS "Anyone can insert players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "Anyone can view players" ON public.players;

-- Drop existing restrictive policies on outings
DROP POLICY IF EXISTS "Anyone can delete outings" ON public.outings;
DROP POLICY IF EXISTS "Anyone can insert outings" ON public.outings;
DROP POLICY IF EXISTS "Anyone can update outings" ON public.outings;
DROP POLICY IF EXISTS "Anyone can view outings" ON public.outings;

-- Players: public read, auth required for mutations
CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert players"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update players"
  ON public.players FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete players"
  ON public.players FOR DELETE
  TO authenticated
  USING (true);

-- Outings: public read, auth required for mutations
CREATE POLICY "Anyone can view outings"
  ON public.outings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert outings"
  ON public.outings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update outings"
  ON public.outings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete outings"
  ON public.outings FOR DELETE
  TO authenticated
  USING (true);

-- Storage: allow authenticated users to manage swing-videos
CREATE POLICY "Authenticated users can upload swing videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'swing-videos');

CREATE POLICY "Anyone can view swing videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'swing-videos');

CREATE POLICY "Authenticated users can delete swing videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'swing-videos');
