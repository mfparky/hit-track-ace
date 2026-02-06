-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  bats TEXT NOT NULL CHECK (bats IN ('L', 'R', 'S')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- For now, allow public read/write access (no auth required for this youth baseball tracker)
CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert players"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON public.players FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete players"
  ON public.players FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();