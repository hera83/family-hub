-- FamilyHub Database Schema (derived from Supabase)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B9DC3'
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  recurrence_type TEXT,
  recurrence_days INTEGER[]
);

CREATE TABLE IF NOT EXISTS item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price NUMERIC,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  calories_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  is_staple BOOLEAN NOT NULL DEFAULT false,
  size_label TEXT,
  name TEXT NOT NULL,
  image_url TEXT,
  unit TEXT DEFAULT 'stk',
  description TEXT
);

CREATE TABLE IF NOT EXISTS recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_time INTEGER,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  wait_time INTEGER,
  title TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Hovedret',
  instructions TEXT
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_staple BOOLEAN NOT NULL DEFAULT false,
  unit TEXT DEFAULT 'stk',
  name TEXT
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  pdf_data TEXT
);

CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price NUMERIC,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  product_name TEXT NOT NULL,
  unit TEXT DEFAULT 'stk',
  category_name TEXT,
  size_label TEXT
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_ordered BOOLEAN NOT NULL DEFAULT false,
  recipe_qty NUMERIC,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ordered_at TIMESTAMPTZ,
  product_name TEXT NOT NULL,
  unit TEXT DEFAULT 'stk',
  source_type TEXT NOT NULL DEFAULT 'manual',
  recipe_unit TEXT
);
