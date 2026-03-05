
-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons (needed for validation at checkout)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Store owners can manage their coupons
CREATE POLICY "Store owners can manage coupons"
ON public.coupons FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = coupons.store_id AND stores.owner_id = auth.uid()
));

-- Admins can manage all coupons
CREATE POLICY "Admins can manage all coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Allow anon to update used_count (for checkout)
GRANT UPDATE ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO anon;

-- Add coupon_code to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
