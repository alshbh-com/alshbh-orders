
-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Also ensure the policy truly works by dropping and recreating with explicit public role
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);
