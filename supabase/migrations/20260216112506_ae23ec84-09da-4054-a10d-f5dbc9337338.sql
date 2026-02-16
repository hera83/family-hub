
-- Add meal_plan_id to shopping_list_items so status can be tracked per meal-plan entry
ALTER TABLE public.shopping_list_items
  ADD COLUMN meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX idx_shopping_list_items_meal_plan_id ON public.shopping_list_items(meal_plan_id);
