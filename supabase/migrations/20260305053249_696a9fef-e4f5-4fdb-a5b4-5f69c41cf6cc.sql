
-- Fix RLS: Make INSERT policies PERMISSIVE for orders and order_items (they were RESTRICTIVE)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create complaints" ON public.complaints;
CREATE POLICY "Anyone can create complaints" ON public.complaints FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Add marketing columns to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS facebook_pixel text DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS tiktok_pixel text DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_analytics text DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS snapchat_pixel text DEFAULT NULL;
