
-- Add columns to store the original recipe quantity and unit
ALTER TABLE public.shopping_list_items
  ADD COLUMN recipe_qty numeric NULL,
  ADD COLUMN recipe_unit text NULL;
