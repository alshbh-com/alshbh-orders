
-- Add order_number column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number integer;

-- Create function to auto-assign sequential order_number per store
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1 INTO next_num
  FROM public.orders
  WHERE store_id = NEW.store_id;
  
  NEW.order_number := next_num;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_assign_order_number ON public.orders;
CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_order_number();

-- Backfill existing orders with sequential numbers per store
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at) as rn
  FROM public.orders
  WHERE order_number IS NULL
)
UPDATE public.orders SET order_number = numbered.rn
FROM numbered WHERE orders.id = numbered.id;
