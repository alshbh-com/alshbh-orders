
-- Re-enable trigger
ALTER TABLE public.orders ENABLE TRIGGER on_order_created;

-- Completely reset RLS on orders
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies on orders and recreate
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update own orders" ON public.orders;

-- Recreate with FORCE so even table owner is subject to RLS
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_all_orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_select_orders" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "owner_update_orders" ON public.orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

-- Same for order_items
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Store owners can view order items" ON public.order_items;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_all_order_items" ON public.order_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_select_order_items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders o JOIN stores s ON s.id = o.store_id WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()));

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
