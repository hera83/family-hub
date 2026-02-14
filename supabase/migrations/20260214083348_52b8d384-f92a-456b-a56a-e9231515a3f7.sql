
-- Products: new columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS calories_per_100g numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fat_per_100g numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS carbs_per_100g numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS protein_per_100g numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fiber_per_100g numeric;

-- Orders: new columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price numeric;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pdf_data text;

-- Order lines: new columns
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS size_label text;

-- Shopping list items: is_ordered flag
ALTER TABLE public.shopping_list_items ADD COLUMN IF NOT EXISTS is_ordered boolean NOT NULL DEFAULT false;
