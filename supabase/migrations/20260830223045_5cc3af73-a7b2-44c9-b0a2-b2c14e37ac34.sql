CREATE TABLE public.stage_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tattoo_id UUID NOT NULL REFERENCES public.tattoos(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.aftercare_stages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tattoo_id, stage_id)
);
GRANT SELECT ON public.stage_follows TO authenticated;
GRANT ALL ON public.stage_follows TO service_role;
ALTER TABLE public.stage_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view stage follows" ON public.stage_follows FOR SELECT TO authenticated USING (true);