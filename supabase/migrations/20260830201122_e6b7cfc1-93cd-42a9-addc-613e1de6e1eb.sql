
CREATE TYPE public.app_role AS ENUM ('admin','artist');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  instagram text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage artists" ON public.artists FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER artists_updated BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  notes text,
  photo_sharing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage clients" ON public.clients FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tattoos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  tattoo_date date NOT NULL DEFAULT current_date,
  style text,
  placement text,
  photo_path text,
  access_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  review_submitted boolean NOT NULL DEFAULT false,
  rebooking_requested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tattoos_client_idx ON public.tattoos(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tattoos TO authenticated;
GRANT ALL ON public.tattoos TO service_role;
ALTER TABLE public.tattoos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage tattoos" ON public.tattoos FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER tattoos_updated BEFORE UPDATE ON public.tattoos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.aftercare_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  day_from int NOT NULL,
  day_to int,
  cleaning text,
  moisturizing text,
  avoid text,
  normal text,
  contact text,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aftercare_stages TO authenticated;
GRANT ALL ON public.aftercare_stages TO service_role;
ALTER TABLE public.aftercare_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage stages" ON public.aftercare_stages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER stages_updated BEFORE UPDATE ON public.aftercare_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.aftercare_stages (slug,title,subtitle,day_from,day_to,cleaning,moisturizing,avoid,normal,contact,sort_order) VALUES
('day-1','Day 1','The first 24 hours',1,1,
 'Leave the studio wrap on for 2-4 hours (or up to 24h if we applied a second-skin film). Wash your hands, remove the wrap gently under lukewarm water, and clean the tattoo with fragrance-free antibacterial soap using your fingertips only. Pat dry with a clean paper towel.',
 'Apply the thinnest possible layer of the aftercare balm we gave you. The tattoo should look matte, never shiny or wet.',
 'No re-wrapping with cling film overnight, no scratching, no tight clothing over the area, no alcohol, no gym.',
 'Redness, warmth, swelling and some ink or plasma weeping are completely normal on day one.',
 'Contact InkPark straight away if the second-skin film leaks, lifts fully, or if you feel intense burning pain.',1),
('day-2-3','Day 2-3','Weeping and settling',2,3,
 'Wash gently 2-3 times a day with lukewarm water and fragrance-free soap. Always pat dry, never rub.',
 'Thin layer of balm or fragrance-free lotion after every wash, 2-3 times a day.',
 'No swimming, saunas, baths, direct sun, gym, or pets sleeping on the area.',
 'Tightness, slight bruising and a shiny sealed look are normal. Some colour may look dull.',
 'Message us if you see spreading redness, yellow-green discharge, or a fever.',2),
('day-4-7','Day 4-7','Peeling begins',4,7,
 'Continue washing twice a day. Keep the area clean and completely dry between washes.',
 'Moisturize 2-3 times a day. If the skin feels itchy, more moisture usually helps.',
 'Do not pick, peel or scratch flakes. No scrubbing, no swimming, no sunbeds.',
 'Flaking, light scabbing and itching are the classic signs of normal healing. The tattoo may look patchy.',
 'Contact us if a scab is thick, cracked and bleeding, or if the itch becomes painful.',3),
('week-2','Week 2','Flaking and dullness',8,14,
 'Once a day is enough now, with gentle soap and lukewarm water.',
 'Keep moisturizing once or twice a day, especially after showering.',
 'Still no swimming pools, sea, sauna or direct sunlight. Avoid heavy sweating.',
 'A cloudy, milky or dull look is completely normal. New skin is forming over the ink.',
 'Reach out if any area stays raised, red and sore beyond this point.',4),
('week-3-4','Week 3-4','Settling in',15,30,
 'Normal showering routine is fine. Keep the skin clean.',
 'Moisturize daily to keep the skin supple and the lines crisp.',
 'Use SPF 50 on the tattoo whenever it is exposed. Avoid long sun exposure.',
 'Colours come back and the surface evens out. Small patchy areas can still settle.',
 'If any spot has lost ink or looks uneven once fully healed, message us about a free touch-up review.',5),
('healed','Fully Healed','Day 30 and beyond',31,NULL,
 'No special cleaning needed, just normal hygiene.',
 'Daily moisturizer keeps the tattoo looking sharp for years.',
 'Sun is the number one enemy of a tattoo. Always use SPF 50.',
 'The tattoo should feel like normal skin with no texture difference.',
 'Book a touch-up review with InkPark if you notice faded or patchy areas.',6);

CREATE TABLE public.healing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tattoo_id uuid NOT NULL REFERENCES public.tattoos(id) ON DELETE CASCADE,
  day_marker int NOT NULL,
  storage_path text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX healing_photos_tattoo_idx ON public.healing_photos(tattoo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.healing_photos TO authenticated;
GRANT ALL ON public.healing_photos TO service_role;
ALTER TABLE public.healing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage healing photos" ON public.healing_photos FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tattoo_id uuid NOT NULL REFERENCES public.tattoos(id) ON DELETE CASCADE,
  message text NOT NULL,
  storage_path text,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_tattoo_idx ON public.support_messages(tattoo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage support" ON public.support_messages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tattoo_id uuid NOT NULL REFERENCES public.tattoos(id) ON DELETE CASCADE,
  day_marker int NOT NULL,
  scheduled_for date NOT NULL,
  sent_at timestamptz,
  channel text NOT NULL DEFAULT 'whatsapp',
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (tattoo_id, day_marker)
);
CREATE INDEX reminders_due_idx ON public.reminders(scheduled_for) WHERE sent_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage reminders" ON public.reminders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.seed_reminders() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.reminders (tattoo_id, day_marker, scheduled_for)
  SELECT NEW.id, d, NEW.tattoo_date + (d - 1)
  FROM unnest(ARRAY[1,3,7,14,30]) AS d
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER tattoos_seed_reminders AFTER INSERT ON public.tattoos
FOR EACH ROW EXECUTE FUNCTION public.seed_reminders();

CREATE TABLE public.studio_settings (
  id boolean PRIMARY KEY DEFAULT true,
  whatsapp_number text,
  contact_email text,
  review_url text,
  booking_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT studio_settings_singleton CHECK (id)
);
GRANT SELECT, INSERT, UPDATE ON public.studio_settings TO authenticated;
GRANT ALL ON public.studio_settings TO service_role;
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage settings" ON public.studio_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.studio_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.studio_settings (id, whatsapp_number, contact_email, review_url, booking_url)
VALUES (true, '+8801700000000', 'hello@inkpark.studio', '/review', '/book');

CREATE POLICY "staff read studio files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('tattoo-photos','healing-photos') AND public.is_staff(auth.uid()));
CREATE POLICY "staff write studio files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('tattoo-photos','healing-photos') AND public.is_staff(auth.uid()));
CREATE POLICY "staff update studio files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('tattoo-photos','healing-photos') AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete studio files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('tattoo-photos','healing-photos') AND public.is_staff(auth.uid()));
