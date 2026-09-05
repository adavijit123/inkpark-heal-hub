CREATE TABLE public.aftercare_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  short text NOT NULL DEFAULT '',
  do_text text NOT NULL DEFAULT '',
  avoid_text text NOT NULL DEFAULT '',
  concern text NOT NULL DEFAULT '',
  question_bn text NOT NULL DEFAULT '',
  short_bn text NOT NULL DEFAULT '',
  do_bn text NOT NULL DEFAULT '',
  avoid_bn text NOT NULL DEFAULT '',
  concern_bn text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.aftercare_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aftercare_faqs TO authenticated;
GRANT ALL ON public.aftercare_faqs TO service_role;

ALTER TABLE public.aftercare_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active faqs" ON public.aftercare_faqs
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "staff manage faqs" ON public.aftercare_faqs
  FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER faqs_updated BEFORE UPDATE ON public.aftercare_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();