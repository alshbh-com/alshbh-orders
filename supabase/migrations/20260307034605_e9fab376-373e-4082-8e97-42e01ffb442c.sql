
CREATE OR REPLACE FUNCTION public.notify_store_owner_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://owgaselrqehbhuseaebr.supabase.co/functions/v1/notify-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z2FzZWxycWVoYmh1c2VhZWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzQ2OTYsImV4cCI6MjA4ODI1MDY5Nn0.aUcAeR5kDjGpdBwyKRTZ_jjT7BqwHYWvYTUiwEQ6e2o'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_store_owner_on_new_order();
