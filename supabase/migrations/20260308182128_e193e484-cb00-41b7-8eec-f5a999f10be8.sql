
-- Store policies table for each store
CREATE TABLE public.store_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  return_policy text DEFAULT '',
  shipping_policy text DEFAULT '',
  privacy_policy text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_policies ENABLE ROW LEVEL SECURITY;

-- Anyone can view store policies
CREATE POLICY "Anyone can view store policies" ON public.store_policies
  FOR SELECT USING (true);

-- Store owners can manage their policies
CREATE POLICY "Store owners can manage policies" ON public.store_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_policies.store_id AND stores.owner_id = auth.uid()
    )
  );

-- Admins can manage all policies
CREATE POLICY "Admins can manage all policies" ON public.store_policies
  FOR ALL USING (has_role(auth.uid(), 'admin'));
