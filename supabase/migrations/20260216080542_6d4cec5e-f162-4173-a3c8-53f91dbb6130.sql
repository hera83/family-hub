
-- Add wait_time to recipes
ALTER TABLE public.recipes ADD COLUMN wait_time integer NULL;

-- Add is_staple to recipe_ingredients (staple items are NOT added to shopping list)
ALTER TABLE public.recipe_ingredients ADD COLUMN is_staple boolean NOT NULL DEFAULT false;

-- Create storage bucket for images (recipes + products)
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Allow public read access to images
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow anyone to upload images (no auth in this app)
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Allow anyone to update images
CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

-- Allow anyone to delete images
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
