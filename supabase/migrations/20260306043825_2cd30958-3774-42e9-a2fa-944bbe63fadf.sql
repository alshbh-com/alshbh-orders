
-- Enable RLS on orders and order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders: anyone can insert (storefront checkout), store owners can manage, admins can manage
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view orders by store"
ON public.orders FOR SELECT
USING (true);

CREATE POLICY "Store owners can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Order items
CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
ON public.order_items FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all order items"
ON public.order_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
