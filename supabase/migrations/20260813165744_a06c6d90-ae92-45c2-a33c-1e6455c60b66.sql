CREATE OR REPLACE FUNCTION public.prevent_payment_field_selfupdate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role / internal server-side calls bypass (no auth.uid())
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.payment_date IS DISTINCT FROM OLD.payment_date
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference THEN
    RAISE EXCEPTION 'No autorizado: los campos de pago solo pueden ser modificados por administradores';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_payment_field_selfupdate ON public.registrations;
CREATE TRIGGER trg_prevent_payment_field_selfupdate
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.prevent_payment_field_selfupdate();