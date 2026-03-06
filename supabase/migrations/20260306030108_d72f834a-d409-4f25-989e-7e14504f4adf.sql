
-- Add store_id column to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- Add store_name column for easy reference
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS store_name text;
