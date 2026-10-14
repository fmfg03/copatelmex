-- Team names are optional in drafts, required for new publication.
-- Existing draft and published JSON is deliberately left untouched.
CREATE OR REPLACE FUNCTION public.validate_state_champion_photos(p_photos jsonb, p_complete boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE category text; photo jsonb; frame jsonb; asset_path text; asset_key text; team_name text;
  trim_chars constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
BEGIN
  IF p_photos IS NULL OR jsonb_typeof(p_photos) <> 'object' THEN
    RAISE EXCEPTION 'Invalid champion photos' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_photos) k WHERE k NOT IN ('varonil','juvenil','femenil'))
     OR (p_complete AND NOT (p_photos ?& ARRAY['varonil','juvenil','femenil'])) THEN
    RAISE EXCEPTION 'All three champion categories are required to publish' USING ERRCODE = '22023';
  END IF;
  FOR category, photo IN SELECT * FROM jsonb_each(p_photos) LOOP
    IF jsonb_typeof(photo) <> 'object'
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(photo) k WHERE k NOT IN ('original_path','image_path','framing','team_name')) THEN
      RAISE EXCEPTION 'Invalid champion photo' USING ERRCODE = '22023';
    END IF;
    IF photo ? 'team_name' THEN
      IF jsonb_typeof(photo->'team_name') <> 'string' THEN
        RAISE EXCEPTION 'Champion team name must be text' USING ERRCODE = '22023';
      END IF;
      team_name := btrim(photo->>'team_name', trim_chars);
      IF char_length(team_name) > 150 THEN
        RAISE EXCEPTION 'Champion team name exceeds 150 characters' USING ERRCODE = '22023';
      END IF;
    ELSE
      team_name := '';
    END IF;
    IF p_complete AND team_name = '' THEN
      RAISE EXCEPTION 'All three champion team names are required to publish' USING ERRCODE = '22023';
    END IF;
    IF NOT (photo ?| ARRAY['original_path','image_path','framing']) THEN
      IF p_complete OR NOT (photo ? 'team_name') THEN
        RAISE EXCEPTION 'Champion photo is required to publish' USING ERRCODE = '22023';
      END IF;
      CONTINUE;
    END IF;
    IF NOT (photo ?& ARRAY['original_path','image_path','framing']) THEN
      RAISE EXCEPTION 'Champion image fields must be complete' USING ERRCODE = '22023';
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

CREATE OR REPLACE FUNCTION public.save_state_champion_draft(p_state text, p_draft jsonb, p_id uuid DEFAULT NULL, p_expected_updated_at timestamptz DEFAULT NULL)
RETURNS public.state_champions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE entry public.state_champions; category text; photo jsonb;
  trim_chars constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  -- Normalize only submitted names, never existing snapshots or omitted names.
  -- This character set exactly matches ECMAScript String.trim whitespace.
  IF jsonb_typeof(p_draft) = 'object' THEN
    FOR category, photo IN SELECT * FROM jsonb_each(p_draft) LOOP
      IF jsonb_typeof(photo) = 'object' AND jsonb_typeof(photo->'team_name') = 'string' THEN
        p_draft := jsonb_set(p_draft, ARRAY[category,'team_name'], to_jsonb(btrim(photo->>'team_name', trim_chars)));
      END IF;
    END LOOP;
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

