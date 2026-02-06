-- Create outings table
CREATE TABLE public.outings (
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

-- Enable Row Level Security
ALTER TABLE public.outings ENABLE ROW LEVEL SECURITY;

-- Public access policies (same as players - shared team tracker)
CREATE POLICY "Anyone can view outings"
  ON public.outings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert outings"
  ON public.outings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update outings"
  ON public.outings FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete outings"
  ON public.outings FOR DELETE
  USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_outings_updated_at
  BEFORE UPDATE ON public.outings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();