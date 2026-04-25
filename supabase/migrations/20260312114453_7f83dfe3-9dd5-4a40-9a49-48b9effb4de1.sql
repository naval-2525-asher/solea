
-- Products table (replaces static products.ts)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'beaded tee',
  image TEXT NOT NULL DEFAULT '',
  sizes TEXT[] NOT NULL DEFAULT '{}',
  available_as TEXT[] NOT NULL DEFAULT '{}',
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  product_tags TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted by anyone" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated by anyone" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted by anyone" ON public.products FOR DELETE USING (true);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 5 CHECK (stars >= 1 AND stars <= 5),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews can be inserted by anyone" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Reviews can be updated by anyone" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Reviews can be deleted by anyone" ON public.reviews FOR DELETE USING (true);

-- New arrivals table
CREATE TABLE public.new_arrivals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.new_arrivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "New arrivals viewable by everyone" ON public.new_arrivals FOR SELECT USING (true);
CREATE POLICY "New arrivals can be inserted" ON public.new_arrivals FOR INSERT WITH CHECK (true);
CREATE POLICY "New arrivals can be updated" ON public.new_arrivals FOR UPDATE USING (true);
CREATE POLICY "New arrivals can be deleted" ON public.new_arrivals FOR DELETE USING (true);

-- Best sellers (references products)
CREATE TABLE public.best_sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  custom_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.best_sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Best sellers viewable by everyone" ON public.best_sellers FOR SELECT USING (true);
CREATE POLICY "Best sellers can be inserted" ON public.best_sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Best sellers can be updated" ON public.best_sellers FOR UPDATE USING (true);
CREATE POLICY "Best sellers can be deleted" ON public.best_sellers FOR DELETE USING (true);

-- Hero banner images
CREATE TABLE public.hero_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hero banners viewable by everyone" ON public.hero_banners FOR SELECT USING (true);
CREATE POLICY "Hero banners can be inserted" ON public.hero_banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Hero banners can be updated" ON public.hero_banners FOR UPDATE USING (true);
CREATE POLICY "Hero banners can be deleted" ON public.hero_banners FOR DELETE USING (true);

-- Site settings (key-value store for announcement text, etc.)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Site settings can be inserted" ON public.site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Site settings can be updated" ON public.site_settings FOR UPDATE USING (true);
CREATE POLICY "Site settings can be deleted" ON public.site_settings FOR DELETE USING (true);

-- Storage bucket for admin uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-uploads', 'admin-uploads', true);

CREATE POLICY "Admin uploads are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'admin-uploads');
CREATE POLICY "Anyone can upload to admin-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'admin-uploads');
CREATE POLICY "Anyone can update admin-uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'admin-uploads');
CREATE POLICY "Anyone can delete from admin-uploads" ON storage.objects FOR DELETE USING (bucket_id = 'admin-uploads');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
