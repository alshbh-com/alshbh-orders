-- Page views tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  visitor_id text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast filtering by date and store
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_store_id ON public.page_views(store_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (public tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- Admins can view all page views
CREATE POLICY "Admins can view all page views" ON public.page_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Store owners can view own page views
CREATE POLICY "Store owners can view own page views" ON public.page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = page_views.store_id AND stores.owner_id = auth.uid()
    )
  );

-- Admins can delete page views
CREATE POLICY "Admins can delete page views" ON public.page_views
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));