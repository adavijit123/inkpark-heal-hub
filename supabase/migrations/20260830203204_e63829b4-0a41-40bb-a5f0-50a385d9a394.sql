ALTER TABLE public.healing_photos
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS artist_feedback text,
  ADD COLUMN IF NOT EXISTS artist_feedback_at timestamp with time zone;