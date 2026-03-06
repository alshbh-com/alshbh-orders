
-- Add referred_by column to stores (references the referrer's store id)
ALTER TABLE public.stores ADD COLUMN referred_by uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- Auto-add 3 points when a new store is created
CREATE OR REPLACE FUNCTION public.auto_add_welcome_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Give 3 free welcome points
  UPDATE public.stores SET points_balance = points_balance + 3 WHERE id = NEW.id;
  
  INSERT INTO public.point_transactions (store_id, amount, type, description)
  VALUES (NEW.id, 3, 'add', '🎉 نقاط ترحيبية مجانية');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_store_created_welcome_points
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_welcome_points();

-- Auto-add 20 referral bonus points when a referred store gets charged 100+ points
CREATE OR REPLACE FUNCTION public.auto_referral_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referred_by uuid;
  v_already_rewarded boolean;
BEGIN
  -- Only trigger on 'add' type with amount >= 100
  IF NEW.type != 'add' OR NEW.amount < 100 THEN
    RETURN NEW;
  END IF;

  -- Check if this store was referred by someone
  SELECT referred_by INTO v_referred_by FROM public.stores WHERE id = NEW.store_id;
  
  IF v_referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if referral bonus was already given for this store
  SELECT EXISTS (
    SELECT 1 FROM public.point_transactions 
    WHERE store_id = v_referred_by 
    AND type = 'referral' 
    AND description LIKE '%' || NEW.store_id::text || '%'
  ) INTO v_already_rewarded;

  IF v_already_rewarded THEN
    RETURN NEW;
  END IF;

  -- Add 20 bonus points to referrer
  UPDATE public.stores SET points_balance = points_balance + 20 WHERE id = v_referred_by;
  
  INSERT INTO public.point_transactions (store_id, amount, type, description)
  VALUES (v_referred_by, 20, 'referral', '🎁 مكافأة إحالة — متجر ' || NEW.store_id::text);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_charge_referral_bonus
AFTER INSERT ON public.point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_referral_bonus();
