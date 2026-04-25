CREATE TABLE public.spotted_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spotted_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spotted images viewable by everyone" ON public.spotted_images FOR SELECT TO public USING (true);
CREATE POLICY "Spotted images can be inserted" ON public.spotted_images FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Spotted images can be updated" ON public.spotted_images FOR UPDATE TO public USING (true);
CREATE POLICY "Spotted images can be deleted" ON public.spotted_images FOR DELETE TO public USING (true);