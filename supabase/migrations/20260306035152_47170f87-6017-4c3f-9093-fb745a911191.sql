
-- Create store_shipping table for governorate-based shipping costs
CREATE TABLE public.store_shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  governorate text NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 70,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(store_id, governorate)
);

-- Enable RLS
ALTER TABLE public.store_shipping ENABLE ROW LEVEL SECURITY;

-- Anyone can view shipping costs
CREATE POLICY "Anyone can view shipping costs"
ON public.store_shipping FOR SELECT
USING (true);

-- Store owners can manage their shipping
CREATE POLICY "Store owners can manage shipping"
ON public.store_shipping FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = store_shipping.store_id AND stores.owner_id = auth.uid()
));

-- Admins can manage all shipping
CREATE POLICY "Admins can manage all shipping"
ON public.store_shipping FOR ALL
USING (has_role(auth.uid(), 'admin'));
