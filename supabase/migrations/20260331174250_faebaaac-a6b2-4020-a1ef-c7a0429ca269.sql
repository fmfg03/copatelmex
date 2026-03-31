-- 1. Fix calculate_check_digit: add search_path
CREATE OR REPLACE FUNCTION public.calculate_check_digit(id_base text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  sum INTEGER := 0;
  i INTEGER;
  char_code INTEGER;
  check_digit INTEGER;
BEGIN
  FOR i IN 1..length(id_base) LOOP
    char_code := ascii(substring(id_base from i for 1));
    sum := sum + (char_code * i);
  END LOOP;
  check_digit := sum % 11;
  IF check_digit = 10 THEN
    RETURN 'X';
  ELSE
    RETURN check_digit::TEXT;
  END IF;
END;
$function$;

-- 2. Fix admin_audit_log INSERT: restrict to authenticated (trigger/function calls use SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix role_audit_log INSERT: restrict to admin
DROP POLICY IF EXISTS "System can insert role audit logs" ON public.role_audit_log;
CREATE POLICY "System can insert role audit logs"
  ON public.role_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));