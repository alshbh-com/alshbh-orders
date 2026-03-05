
-- Grant table permissions to anon and authenticated roles
GRANT SELECT ON public.stores TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.templates TO anon, authenticated;
GRANT SELECT ON public.pages TO anon, authenticated;

-- Orders: anon can INSERT (create orders), store owners can SELECT/UPDATE
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;

-- Reviews: anyone can INSERT, everyone can SELECT
GRANT INSERT ON public.reviews TO anon, authenticated;

-- Complaints: anyone can INSERT
GRANT INSERT ON public.complaints TO anon, authenticated;

-- Authenticated users need more permissions
GRANT ALL ON public.stores TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.product_images TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.point_transactions TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.complaints TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.pages TO authenticated;
GRANT ALL ON public.templates TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
