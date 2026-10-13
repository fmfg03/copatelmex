-- Run only in a disposable Supabase-compatible database after the migration.
-- All fixtures roll back. Requires a migration-owner connection (SET ROLE).
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id, aud, role, email) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','authenticated','authenticated','champions-admin@example.invalid'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','authenticated','authenticated','champions-member@example.invalid'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','authenticated','authenticated','champions-moderator@example.invalid');
INSERT INTO public.user_roles(user_id,role) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','admin'), ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','moderator');
INSERT INTO storage.objects(bucket_id,name,metadata) VALUES
 ('gallery-media','champions/test-original.jpg','{"mimetype":"image/jpeg","size":1024}'),
 ('gallery-media','champions/test-banner.webp','{"mimetype":"image/webp","size":512}'),
 ('gallery-media','champions/test-next.webp','{"mimetype":"image/webp","size":512}'),
 ('gallery-media','champions/test-wrong.jpg','{"mimetype":"image/svg+xml","size":512}'),
 ('gallery-media','champions/test-large.jpg','{"mimetype":"image/jpeg","size":10485761}');

SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM * FROM public.state_champions; RAISE EXCEPTION 'anon read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Aguascalientes','{}'); RAISE EXCEPTION 'anon write allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.get_published_state_champions()) THEN RAISE EXCEPTION 'draft leaked'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.state_champions) THEN RAISE EXCEPTION 'member read allowed'; END IF;
  BEGIN PERFORM public.save_state_champion_draft('Aguascalientes','{}'); RAISE EXCEPTION 'member write allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.state_champions(state) VALUES ('Chiapas'); RAISE EXCEPTION 'direct write allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE e public.state_champions; old_version timestamptz; photo jsonb; complete jsonb; changed jsonb;
BEGIN
  photo := '{"original_path":"champions/test-original.jpg","image_path":"champions/test-banner.webp","framing":{"zoom":1,"x":50,"y":50}}'::jsonb;
  complete := jsonb_build_object('varonil',photo,'juvenil',photo,'femenil',photo);
  BEGIN PERFORM public.save_state_champion_draft('Invalid state','{}'); RAISE EXCEPTION 'invalid state allowed';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('other',photo)); RAISE EXCEPTION 'invalid category allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('varonil',jsonb_set(photo,'{image_path}','"champions/missing.webp"'))); RAISE EXCEPTION 'missing file allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('varonil',jsonb_set(photo,'{framing,zoom}','100'))); RAISE EXCEPTION 'unsafe framing allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('varonil',jsonb_set(photo,'{image_path}','"champions/test-wrong.jpg"'))); RAISE EXCEPTION 'unsupported MIME allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('varonil',jsonb_set(photo,'{image_path}','"champions/test-large.jpg"'))); RAISE EXCEPTION 'oversize allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas',jsonb_build_object('varonil',jsonb_set(photo,'{image_path}','"champions/../test-banner.webp"'))); RAISE EXCEPTION 'path traversal allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  e := public.save_state_champion_draft('Aguascalientes',jsonb_build_object('varonil',photo));
  IF NOT EXISTS(SELECT 1 FROM public.state_champions WHERE id=e.id) THEN RAISE EXCEPTION 'admin cannot read'; END IF;
  BEGIN PERFORM public.publish_state_champion(e.id,e.updated_at); RAISE EXCEPTION 'incomplete publish allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.get_published_state_champions()) THEN RAISE EXCEPTION 'draft leaked'; END IF;
  old_version := e.updated_at;
  e := public.save_state_champion_draft(e.state,complete,e.id,e.updated_at);
  BEGIN PERFORM public.save_state_champion_draft(e.state,complete,e.id,old_version); RAISE EXCEPTION 'stale save allowed';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN PERFORM public.publish_state_champion(e.id,old_version); RAISE EXCEPTION 'stale publish allowed';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  e := public.publish_state_champion(e.id,e.updated_at);
  changed := jsonb_set(complete,'{varonil,image_path}','"champions/test-next.webp"');
  e := public.save_state_champion_draft(e.state,changed,e.id,e.updated_at);
  IF (SELECT photos FROM public.get_published_state_champions() WHERE id=e.id) <> complete THEN RAISE EXCEPTION 'draft edit changed published snapshot'; END IF;
  e := public.publish_state_champion(e.id,e.updated_at);
  IF (SELECT photos FROM public.get_published_state_champions() WHERE id=e.id) <> changed THEN RAISE EXCEPTION 'republish failed'; END IF;
  BEGIN PERFORM public.withdraw_state_champion(e.id,old_version); RAISE EXCEPTION 'stale withdraw allowed';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ DECLARE snapshot jsonb; BEGIN
  SELECT photos INTO snapshot FROM public.get_published_state_champions() WHERE state='Aguascalientes';
  IF snapshot IS NULL OR NOT(snapshot ?& ARRAY['varonil','juvenil','femenil']) THEN RAISE EXCEPTION 'anon cannot read publication'; END IF;
  IF snapshot->'varonil'->>'image_path' <> 'champions/test-next.webp' THEN RAISE EXCEPTION 'anon got wrong snapshot'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ DECLARE e public.state_champions; previous_draft jsonb; BEGIN
  SELECT * INTO e FROM public.state_champions WHERE state='Aguascalientes';
  previous_draft := e.draft;
  e := public.withdraw_state_champion(e.id,e.updated_at);
  IF EXISTS(SELECT 1 FROM public.get_published_state_champions() WHERE id=e.id) OR e.draft <> previous_draft THEN RAISE EXCEPTION 'withdraw failed'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.state_champions) THEN RAISE EXCEPTION 'member can read populated drafts'; END IF;
  BEGIN PERFORM public.publish_state_champion('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now()); RAISE EXCEPTION 'member publish allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.withdraw_state_champion('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now()); RAISE EXCEPTION 'member withdraw allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.state_champions) THEN RAISE EXCEPTION 'moderator can read drafts'; END IF;
  BEGIN PERFORM public.save_state_champion_draft('Chiapas','{}'); RAISE EXCEPTION 'moderator save allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.publish_state_champion('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now()); RAISE EXCEPTION 'moderator publish allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.withdraw_state_champion('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now()); RAISE EXCEPTION 'moderator withdraw allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
