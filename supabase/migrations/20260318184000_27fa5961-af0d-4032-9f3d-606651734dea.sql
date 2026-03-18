
CREATE TABLE public.recipe_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.recipe_categories
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

INSERT INTO public.recipe_categories (name, sort_order) VALUES
  ('Forret', 1),
  ('Hovedret', 2),
  ('Dessert', 3),
  ('Pasta', 4),
  ('Vegetarisk', 5),
  ('Salat', 6),
  ('Suppe', 7);
