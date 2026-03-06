
CREATE OR REPLACE FUNCTION public.auto_add_welcome_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Give 5 free welcome points (5 orders free)
  UPDATE public.stores SET points_balance = points_balance + 5 WHERE id = NEW.id;
  
  INSERT INTO public.point_transactions (store_id, amount, type, description)
  VALUES (NEW.id, 5, 'add', '🎉 نقاط ترحيبية مجانية - 5 أوردرات هدية');
  
  RETURN NEW;
END;
$function$;
