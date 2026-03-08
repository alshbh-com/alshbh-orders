
-- Create function to notify admin when new user signs up
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://owgaselrqehbhuseaebr.supabase.co/functions/v1/notify-admin-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z2FzZWxycWVoYmh1c2VhZWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzQ2OTYsImV4cCI6MjA4ODI1MDY5Nn0.aUcAeR5kDjGpdBwyKRTZ_jjT7BqwHYWvYTUiwEQ6e2o'
    ),
    body := jsonb_build_object('record', jsonb_build_object(
      'id', NEW.id,
      'full_name', NEW.full_name,
      'email', ''
    ))
  );
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (auto-created on signup)
CREATE TRIGGER on_new_profile_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_new_user();
