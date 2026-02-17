-- ============================================================
-- RECREATE TABLES FOR hit-track-ace
-- Safe to run: uses IF NOT EXISTS / IF EXISTS guards
-- Does NOT delete or modify any other tables
-- ============================================================

-- 1. Create the shared trigger function (used by both tables)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Create the players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  bats TEXT NOT NULL CHECK (bats IN ('L', 'R', 'S')),
  avatar TEXT,
  youtube_playlist_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS on players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 4. Players RLS policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can insert players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can delete players" ON public.players;
-- Also drop any old policy names from earlier migrations
DROP POLICY IF EXISTS "Anyone can insert players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;

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

-- 5. Players updated_at trigger
DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create the outings table
CREATE TABLE IF NOT EXISTS public.outings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('game', 'batting_practice', 'cage_session', 'live_abs')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opponent TEXT,
  at_bats JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Enable RLS on outings
ALTER TABLE public.outings ENABLE ROW LEVEL SECURITY;

-- 8. Outings RLS policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view outings" ON public.outings;
DROP POLICY IF EXISTS "Authenticated users can insert outings" ON public.outings;
DROP POLICY IF EXISTS "Authenticated users can update outings" ON public.outings;
DROP POLICY IF EXISTS "Authenticated users can delete outings" ON public.outings;
-- Also drop any old policy names from earlier migrations
DROP POLICY IF EXISTS "Anyone can insert outings" ON public.outings;
DROP POLICY IF EXISTS "Anyone can update outings" ON public.outings;
DROP POLICY IF EXISTS "Anyone can delete outings" ON public.outings;

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

-- 9. Outings updated_at trigger
DROP TRIGGER IF EXISTS update_outings_updated_at ON public.outings;
CREATE TRIGGER update_outings_updated_at
  BEFORE UPDATE ON public.outings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create swing-videos storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('swing-videos', 'swing-videos', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- 11. Storage RLS policies (clean up all old + new names first)
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload swing videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view swing videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete swing videos" ON storage.objects;

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
