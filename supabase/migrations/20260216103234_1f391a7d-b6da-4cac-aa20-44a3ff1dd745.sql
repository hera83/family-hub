
ALTER TABLE public.shopping_list_items 
ADD COLUMN order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN ordered_at timestamptz;
