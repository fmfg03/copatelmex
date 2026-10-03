-- Additive directory. Personal information never resides in the public contact table.
BEGIN;
CREATE FUNCTION public.valid_representative_birthday(value text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
BEGIN
  IF value IS NULL THEN RETURN true; END IF;
  IF value !~ '^[0-9]{2}-[0-9]{2}$' THEN RETURN false; END IF;
  PERFORM make_date(2000, substring(value, 1, 2)::integer, substring(value, 4, 2)::integer);
  RETURN true;
EXCEPTION WHEN datetime_field_overflow THEN RETURN false;
END;
$$;
CREATE TABLE public.state_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_slug text NOT NULL CHECK (state_slug IN ('aguascalientes', 'baja-california', 'baja-california-sur', 'campeche', 'chiapas', 'chihuahua', 'ciudad-de-mexico', 'coahuila', 'colima', 'durango', 'guanajuato', 'guerrero', 'hidalgo', 'jalisco', 'estado-de-mexico', 'michoacan', 'morelos', 'nayarit', 'nuevo-leon', 'oaxaca', 'puebla', 'queretaro', 'quintana-roo', 'san-luis-potosi', 'sinaloa', 'sonora', 'tabasco', 'tamaulipas', 'tlaxcala', 'veracruz', 'yucatan', 'zacatecas')),
  zone text NOT NULL DEFAULT '' CHECK (length(zone) <= 120),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text CHECK (phone IS NULL OR (length(phone) <= 40 AND phone ~ '^[0-9+() .-]+$' AND phone ~ '[0-9]')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Exact duplicate contacts are rejected; several contacts per state/zone are allowed.
CREATE UNIQUE INDEX state_representatives_identity ON public.state_representatives
(state_slug, lower(btrim(zone)), lower(btrim(name)), lower(btrim(email)));
CREATE TABLE public.representative_personal_details (
  representative_id uuid PRIMARY KEY REFERENCES public.state_representatives(id),
  spouse_name text CHECK (spouse_name IS NULL OR length(btrim(spouse_name)) BETWEEN 1 AND 200),
  representative_birthday text CHECK (public.valid_representative_birthday(representative_birthday)),
  spouse_birthday text CHECK (public.valid_representative_birthday(spouse_birthday))
);
ALTER TABLE public.state_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representative_personal_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.state_representatives, public.representative_personal_details FROM anon, authenticated;
GRANT SELECT ON public.state_representatives, public.representative_personal_details TO anon, authenticated;
CREATE POLICY public_active_contacts ON public.state_representatives FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY operations_all_contacts ON public.state_representatives FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role));
CREATE POLICY operations_personal_details ON public.representative_personal_details FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role));
-- No direct client writes: this RPC checks authority and saves both tables in one transaction.
CREATE FUNCTION public.save_state_representative(
  p_id uuid, p_state_slug text, p_zone text, p_name text, p_email text, p_phone text,
  p_is_active boolean, p_spouse_name text, p_representative_birthday text, p_spouse_birthday text,
  p_expected_updated_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_updated_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.state_representatives(state_slug, zone, name, email, phone, is_active)
    VALUES (p_state_slug, btrim(coalesce(p_zone, '')), btrim(p_name), lower(btrim(p_email)), nullif(btrim(p_phone), ''), p_is_active)
    RETURNING id INTO v_id;
  ELSE
    SELECT updated_at INTO v_updated_at FROM public.state_representatives WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Representante inexistente'; END IF;
    IF p_expected_updated_at IS NULL OR v_updated_at <> p_expected_updated_at THEN
      RAISE EXCEPTION 'El registro cambió. Actualiza la lista antes de guardar.' USING ERRCODE = '40001';
    END IF;
    UPDATE public.state_representatives SET state_slug = p_state_slug, zone = btrim(coalesce(p_zone, '')),
      name = btrim(p_name), email = lower(btrim(p_email)), phone = nullif(btrim(p_phone), ''),
      is_active = p_is_active, updated_at = clock_timestamp() WHERE id = p_id;
    v_id := p_id;
  END IF;
  INSERT INTO public.representative_personal_details(representative_id, spouse_name, representative_birthday, spouse_birthday)
  VALUES (v_id, nullif(btrim(p_spouse_name), ''), nullif(p_representative_birthday, ''), nullif(p_spouse_birthday, ''))
  ON CONFLICT (representative_id) DO UPDATE SET spouse_name = EXCLUDED.spouse_name,
    representative_birthday = EXCLUDED.representative_birthday, spouse_birthday = EXCLUDED.spouse_birthday;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_state_representative(uuid,text,text,text,text,text,boolean,text,text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_state_representative(uuid,text,text,text,text,text,boolean,text,text,text,timestamptz) TO authenticated;
-- Preserve every published contact, including both Estado de México zones and pending names.
INSERT INTO public.state_representatives(id, state_slug, zone, name, email, phone) VALUES
(md5('copatelmex-representative:aguascalientes:')::uuid, 'aguascalientes', '', 'Gilberto Saucedo', 'gilsau_14@hotmail.com', NULL),
(md5('copatelmex-representative:baja-california:')::uuid, 'baja-california', '', 'Jesús Appel', 'appel.surf@gmail.com', NULL),
(md5('copatelmex-representative:baja-california-sur:')::uuid, 'baja-california-sur', '', 'Jorge Alvarado', 'jorge94@hotmail.com', NULL),
(md5('copatelmex-representative:campeche:')::uuid, 'campeche', '', 'Emmanuel Talango', 'asociaciondefutboldelestadodecampeche@hotmail.com', NULL),
(md5('copatelmex-representative:chiapas:')::uuid, 'chiapas', '', 'José Tacías', 'tacias_gallegos@hotmail.com', NULL),
(md5('copatelmex-representative:chihuahua:')::uuid, 'chihuahua', '', 'Francisco Adrián Valdez Galindo', 'gallobany@gmail.com', NULL),
(md5('copatelmex-representative:ciudad-de-mexico:')::uuid, 'ciudad-de-mexico', '', 'Araceli Márquez', 'asocfut@hotmail.com', NULL),
(md5('copatelmex-representative:coahuila:')::uuid, 'coahuila', '', 'Juan Elizalde', 'elizaldejuan031@gmail.com', NULL),
(md5('copatelmex-representative:colima:')::uuid, 'colima', '', 'Alejandro Ponce', 'alejandropc17266@hotmail.com', NULL),
(md5('copatelmex-representative:durango:')::uuid, 'durango', '', 'Jesús Vargas', 'cuquisfutbol_dgo@hotmail.com', NULL),
(md5('copatelmex-representative:guanajuato:')::uuid, 'guanajuato', '', 'Christian Gómez', 'tuzospachuca_leon@hotmail.com', NULL),
(md5('copatelmex-representative:guerrero:')::uuid, 'guerrero', '', 'Guillermo Moreno', 'gallo_futbol@hotmail.com', NULL),
(md5('copatelmex-representative:hidalgo:')::uuid, 'hidalgo', '', 'Mayra Cruz', 'mec79jb@gmail.com', NULL),
(md5('copatelmex-representative:jalisco:')::uuid, 'jalisco', '', 'Mauricio Figueroa', 'mauricio.fimo.ufd@gmail.com', NULL),
(md5('copatelmex-representative:estado-de-mexico:Valle de México')::uuid, 'estado-de-mexico', 'Valle de México', 'Juliana Martín', 'asoc_mex@yahoo.com.mx', NULL),
(md5('copatelmex-representative:estado-de-mexico:Valle de Toluca')::uuid, 'estado-de-mexico', 'Valle de Toluca', 'Jesús Mondragón', 'jesusmondragon66@hotmail.com', '7223581093'),
(md5('copatelmex-representative:michoacan:')::uuid, 'michoacan', '', 'Felipe Nery Luna', 'apodacaupn@live.com.mx', NULL),
(md5('copatelmex-representative:morelos:')::uuid, 'morelos', '', 'José Antonio Albarrán Salazar', 'jaqueline.afaem@gmail.com', NULL),
(md5('copatelmex-representative:nayarit:')::uuid, 'nayarit', '', 'Jose Antonio Huizar', 'nubia_camacho@hotmail.com', NULL),
(md5('copatelmex-representative:nuevo-leon:')::uuid, 'nuevo-leon', '', 'Paola Sánchez', 'pao8786@gmail.com', NULL),
(md5('copatelmex-representative:oaxaca:')::uuid, 'oaxaca', '', 'Roberto Castellanos', 'ghos_31@hotmail.com', NULL),
(md5('copatelmex-representative:puebla:')::uuid, 'puebla', '', 'Braulio Casco / Antonio Iriarte', 'braucarey@gmail.com', NULL),
(md5('copatelmex-representative:queretaro:')::uuid, 'queretaro', '', 'Mario Villanueva', 'marioavd@hotmail.com', NULL),
(md5('copatelmex-representative:quintana-roo:')::uuid, 'quintana-roo', '', 'Ismael Pulido', 'ismael_medina1@hotmail.com', NULL),
(md5('copatelmex-representative:san-luis-potosi:')::uuid, 'san-luis-potosi', '', 'Pedro Cadena', 'pedro_cadenag@hotmail.com', NULL),
(md5('copatelmex-representative:sinaloa:')::uuid, 'sinaloa', '', 'Paul Milan', 'afoesac@hotmail.com', NULL),
(md5('copatelmex-representative:sonora:')::uuid, 'sonora', '', 'Por confirmar', 'contacto@copatelmex.mx', NULL),
(md5('copatelmex-representative:tabasco:')::uuid, 'tabasco', '', 'Por confirmar', 'contacto@copatelmex.mx', NULL),
(md5('copatelmex-representative:tamaulipas:')::uuid, 'tamaulipas', '', 'José Mansur', 'pepecorre@hotmail.com', NULL),
(md5('copatelmex-representative:tlaxcala:')::uuid, 'tlaxcala', '', 'Miguel Águila', 'matlacuilom@hotmail.com', NULL),
(md5('copatelmex-representative:veracruz:')::uuid, 'veracruz', '', 'José Luis Espejo', 'asandovalg35@gmail.com', NULL),
(md5('copatelmex-representative:yucatan:')::uuid, 'yucatan', '', 'Manuel Martín', 'afeyac@hotmail.com', NULL),
(md5('copatelmex-representative:zacatecas:')::uuid, 'zacatecas', '', 'Manuel Ruiz Guzman', 'manuelruizguzmann@gmail.com', NULL)
ON CONFLICT DO NOTHING;
INSERT INTO public.representative_personal_details(representative_id)
SELECT id FROM public.state_representatives ON CONFLICT DO NOTHING;
COMMIT;
