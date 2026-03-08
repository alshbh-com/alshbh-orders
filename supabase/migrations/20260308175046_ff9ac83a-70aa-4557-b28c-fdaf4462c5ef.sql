-- Drop all existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_new_profile_notify_admin ON public.profiles;
DROP TRIGGER IF EXISTS on_new_order_notify_owner ON public.orders;
DROP TRIGGER IF EXISTS on_new_order_deduct_point ON public.orders;
DROP TRIGGER IF EXISTS on_new_order_assign_number ON public.orders;
DROP TRIGGER IF EXISTS on_new_store_welcome_points ON public.stores;
DROP TRIGGER IF EXISTS on_point_transaction_referral ON public.point_transactions;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate all triggers
CREATE TRIGGER on_new_profile_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_user();

CREATE TRIGGER on_new_order_notify_owner
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_store_owner_on_new_order();

CREATE TRIGGER on_new_order_deduct_point
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_point_on_order();

CREATE TRIGGER on_new_order_assign_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_order_number();

CREATE TRIGGER on_new_store_welcome_points
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_welcome_points();

CREATE TRIGGER on_point_transaction_referral
  AFTER INSERT ON public.point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_referral_bonus();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();