-- Draft metadata is private; only immutable published snapshots reach the home.
CREATE TABLE public.state_champions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE CHECK (state IN ('Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas')),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  published_at timestamptz,
  CHECK ((published IS NULL) = (published_at IS NULL))
);
ALTER TABLE public.state_champions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.state_champions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.state_champions TO authenticated;
CREATE POLICY "Admins read champion drafts" ON public.state_champions
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Internal validator: exact JSON shapes, bounded framing, existing supported assets.
CREATE FUNCTION public.validate_state_champion_photos(p_photos jsonb, p_complete boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE category text; photo jsonb; frame jsonb; asset_path text; asset_key text;
BEGIN
  IF p_photos IS NULL OR jsonb_typeof(p_photos) <> 'object' THEN
    RAISE EXCEPTION 'Invalid champion photos' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_photos) k WHERE k NOT IN ('varonil','juvenil','femenil'))
     OR (p_complete AND NOT (p_photos ?& ARRAY['varonil','juvenil','femenil'])) THEN
    RAISE EXCEPTION 'All three champion categories are required to publish' USING ERRCODE = '22023';
  END IF;
  FOR category, photo IN SELECT * FROM jsonb_each(p_photos) LOOP
    IF jsonb_typeof(photo) <> 'object' OR NOT (photo ?& ARRAY['original_path','image_path','framing'])
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(photo) k WHERE k NOT IN ('original_path','image_path','framing')) THEN
      RAISE EXCEPTION 'Invalid champion photo' USING ERRCODE = '22023';
    END IF;
    frame := photo->'framing';
    IF jsonb_typeof(frame) <> 'object' OR NOT (frame ?& ARRAY['zoom','x','y'])
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(frame) k WHERE k NOT IN ('zoom','x','y')) THEN
      RAISE EXCEPTION 'Invalid photo framing' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(frame->'zoom') <> 'number' OR jsonb_typeof(frame->'x') <> 'number' OR jsonb_typeof(frame->'y') <> 'number' THEN
      RAISE EXCEPTION 'Invalid photo framing numbers' USING ERRCODE = '22023';
    END IF;
    IF (frame->>'zoom')::numeric NOT BETWEEN 1 AND 3 OR (frame->>'x')::numeric NOT BETWEEN 0 AND 100 OR (frame->>'y')::numeric NOT BETWEEN 0 AND 100 THEN
      RAISE EXCEPTION 'Photo framing outside permitted range' USING ERRCODE = '22023';
    END IF;
    FOREACH asset_key IN ARRAY ARRAY['original_path','image_path'] LOOP
      asset_path := photo->>asset_key;
      IF jsonb_typeof(photo->asset_key) <> 'string' OR asset_path !~ '^champions/[A-Za-z0-9/_-]+[.](jpg|jpeg|png|webp)$'
        OR asset_path LIKE '%//%' OR NOT EXISTS (
          SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'gallery-media' AND o.name = asset_path
          AND o.metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')
          AND (o.metadata->>'size') ~ '^[0-9]+$'
          AND (o.metadata->>'size')::numeric BETWEEN 1 AND 10485760
        ) THEN
        RAISE EXCEPTION 'Champion image is missing or unsupported' USING ERRCODE = '22023';
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_state_champion_photos(jsonb,boolean) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.save_state_champion_draft(p_state text, p_draft jsonb, p_id uuid DEFAULT NULL, p_expected_updated_at timestamptz DEFAULT NULL)
RETURNS public.state_champions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE entry public.state_champions;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  PERFORM public.validate_state_champion_photos(p_draft, false);
  IF p_id IS NULL THEN
    INSERT INTO public.state_champions(state,draft) VALUES (p_state,p_draft) RETURNING * INTO entry;
  ELSE
    SELECT * INTO entry FROM public.state_champions WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Champion state not found' USING ERRCODE = 'P0002'; END IF;
    IF p_expected_updated_at IS NULL OR entry.updated_at <> p_expected_updated_at THEN
      RAISE EXCEPTION 'Champion state changed; reload before saving' USING ERRCODE = '40001';
    END IF;
    IF entry.state <> p_state THEN RAISE EXCEPTION 'State cannot be changed' USING ERRCODE = '22023'; END IF;
    UPDATE public.state_champions SET draft = p_draft, updated_at = greatest(clock_timestamp(), entry.updated_at + interval '1 microsecond')
      WHERE id = p_id RETURNING * INTO entry;
  END IF;
  RETURN entry;
END;
$$;

CREATE FUNCTION public.publish_state_champion(p_id uuid, p_expected_updated_at timestamptz)
RETURNS public.state_champions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE entry public.state_champions;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO entry FROM public.state_champions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Champion state not found' USING ERRCODE = 'P0002'; END IF;
  IF p_expected_updated_at IS NULL OR entry.updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION 'Champion state changed; reload before publishing' USING ERRCODE = '40001';
  END IF;
  PERFORM public.validate_state_champion_photos(entry.draft, true);
  UPDATE public.state_champions SET published = draft, published_at = clock_timestamp(),
    updated_at = greatest(clock_timestamp(), entry.updated_at + interval '1 microsecond') WHERE id = p_id RETURNING * INTO entry;
  RETURN entry;
END;
$$;

CREATE FUNCTION public.withdraw_state_champion(p_id uuid, p_expected_updated_at timestamptz)
RETURNS public.state_champions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE entry public.state_champions;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO entry FROM public.state_champions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Champion state not found' USING ERRCODE = 'P0002'; END IF;
  IF p_expected_updated_at IS NULL OR entry.updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION 'Champion state changed; reload before withdrawing' USING ERRCODE = '40001';
  END IF;
  UPDATE public.state_champions SET published = NULL, published_at = NULL,
    updated_at = greatest(clock_timestamp(), entry.updated_at + interval '1 microsecond') WHERE id = p_id RETURNING * INTO entry;
  RETURN entry;
END;
$$;

CREATE FUNCTION public.get_published_state_champions()
RETURNS TABLE(id uuid, state text, photos jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.id, c.state, c.published FROM public.state_champions c WHERE c.published IS NOT NULL ORDER BY c.state;
$$;
REVOKE ALL ON FUNCTION public.save_state_champion_draft(text,jsonb,uuid,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_state_champion(uuid,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.withdraw_state_champion(uuid,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_published_state_champions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_state_champion_draft(text,jsonb,uuid,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_state_champion(uuid,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_state_champion(uuid,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_state_champions() TO anon, authenticated;
