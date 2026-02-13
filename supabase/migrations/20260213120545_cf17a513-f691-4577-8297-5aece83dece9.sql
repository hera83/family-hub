
-- Family members
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B9DC3',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item categories for shopping list grouping
CREATE TABLE public.item_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products catalog
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  unit TEXT DEFAULT 'stk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipes
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Hovedret',
  prep_time INT,
  instructions TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe ingredients
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'stk',
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meal plans
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_date DATE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shopping list items
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'stk',
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'recipe')),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order lines
CREATE TABLE public.order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'stk',
  category_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables with public access (no auth needed)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

-- Public access policies (no authentication needed - family kiosk app)
CREATE POLICY "Public access" ON public.family_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.item_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.meal_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.shopping_list_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.order_lines FOR ALL USING (true) WITH CHECK (true);

-- Seed default item categories
INSERT INTO public.item_categories (name, sort_order) VALUES
  ('Kød & Fjerkræ', 1),
  ('Fisk & Skaldyr', 2),
  ('Mejeri', 3),
  ('Frugt & Grønt', 4),
  ('Brød & Bagværk', 5),
  ('Frost', 6),
  ('Konserves', 7),
  ('Krydderier & Sovs', 8),
  ('Drikkevarer', 9),
  ('Snacks', 10),
  ('Andet', 11);

-- Seed a default "Familie" member
INSERT INTO public.family_members (name, color) VALUES ('Familie', '#8B9DC3');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
