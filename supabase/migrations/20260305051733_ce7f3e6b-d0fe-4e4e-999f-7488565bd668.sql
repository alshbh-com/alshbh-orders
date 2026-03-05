
-- Add stock and discount_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price numeric DEFAULT NULL;

-- Add shipping_cost to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 70;

-- Create product_variants table for sizes and colors
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text DEFAULT NULL,
  color text DEFAULT NULL,
  stock integer NOT NULL DEFAULT 0,
  price_adjustment numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Anyone can view variants
CREATE POLICY "Anyone can view variants" ON public.product_variants FOR SELECT USING (true);

-- Store owners can manage variants
CREATE POLICY "Store owners can manage variants" ON public.product_variants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()
  )
);

-- Admins can manage all variants
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (
  has_role(auth.uid(), 'admin')
);

-- Add order notes and selected variant info to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_size text DEFAULT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_color text DEFAULT NULL;

-- Add customer notes and shipping cost to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_notes text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 70;
