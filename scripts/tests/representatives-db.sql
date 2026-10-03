-- Run only in a disposable database with the migration applied. Transaction rolls back test rows.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(value boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF value IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF; RAISE NOTICE 'PASS: %', message; END; $$;
SELECT pg_temp.assert_true((SELECT count(*) = 33 FROM public.state_representatives), '33 seeded contacts');
SELECT pg_temp.assert_true((SELECT count(DISTINCT state_slug) = 32 FROM public.state_representatives), '32 states');
SELECT pg_temp.assert_true((SELECT count(*) = 2 FROM public.state_representatives WHERE state_slug = 'estado-de-mexico'), 'both Mexico zones');
SELECT pg_temp.assert_true((SELECT count(*) = 2 FROM public.state_representatives WHERE name = 'Por confirmar'), 'pending names preserved');
SELECT pg_temp.assert_true((SELECT bool_and(spouse_name IS NULL AND representative_birthday IS NULL AND spouse_birthday IS NULL) FROM public.representative_personal_details), 'personal fields initially empty');
SELECT pg_temp.assert_true(public.valid_representative_birthday('02-29') AND NOT public.valid_representative_birthday('02-30') AND NOT public.valid_representative_birthday('04-31') AND NOT public.valid_representative_birthday('00-01'), 'database birthday validation');
SELECT pg_temp.assert_true(NOT has_table_privilege('authenticated', 'public.state_representatives', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.representative_personal_details', 'INSERT'), 'no direct client writes');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
SELECT set_config('test.role', 'admin', true);
SELECT public.save_state_representative(NULL, 'jalisco', 'Prueba', 'Representante de prueba', 'prueba@example.test', NULL, true, 'Conyuge de prueba', '02-29', '12-31', NULL) AS test_id \gset
SELECT pg_temp.assert_true((SELECT spouse_name = 'Conyuge de prueba' FROM public.representative_personal_details WHERE representative_id = :'test_id'), 'admin create saves personal fields');
SELECT updated_at AS original_version FROM public.state_representatives WHERE id = :'test_id' \gset
SELECT public.save_state_representative(:'test_id', 'jalisco', 'Prueba', 'Representante editado', 'prueba@example.test', '5551234567', false, 'Conyuge editado', '01-01', NULL, :'original_version');
SELECT pg_temp.assert_true((SELECT NOT is_active AND name = 'Representante editado' FROM public.state_representatives WHERE id = :'test_id'), 'admin edit and logical deactivation');
SELECT pg_temp.assert_true((SELECT spouse_name = 'Conyuge editado' AND spouse_birthday IS NULL FROM public.representative_personal_details WHERE representative_id = :'test_id'), 'personal update and clear field');
-- Assert rejected save attempts leave no partial contact rows.
DO $$ BEGIN
  BEGIN PERFORM public.save_state_representative(NULL, 'jalisco', '', 'Invalid birthday', 'bad@example.test', NULL, true, NULL, '02-30', NULL, NULL); RAISE EXCEPTION 'expected invalid date failure';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.state_representatives WHERE email = 'bad@example.test'), 'invalid personal field rolls back contact');
DO $$ DECLARE r public.state_representatives; BEGIN
  SELECT * INTO r FROM public.state_representatives WHERE email = 'prueba@example.test';
  BEGIN PERFORM public.save_state_representative(r.id, r.state_slug, r.zone, r.name, r.email, r.phone, true, NULL, NULL, NULL, r.created_at); RAISE EXCEPTION 'expected concurrency failure';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
SELECT pg_temp.assert_true((SELECT NOT is_active FROM public.state_representatives WHERE email = 'prueba@example.test'), 'stale edit rejected');
DO $$ BEGIN
  BEGIN PERFORM public.save_state_representative(NULL, 'jalisco', 'Prueba', 'Representante editado', 'prueba@example.test', NULL, true, NULL, NULL, NULL, NULL); RAISE EXCEPTION 'expected duplicate failure';
  EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
SELECT set_config('test.role', 'moderator', true);
SELECT pg_temp.assert_true((SELECT count(*) = 34 FROM public.state_representatives), 'moderator sees inactive contacts');
SELECT pg_temp.assert_true((SELECT spouse_name = 'Conyuge editado' FROM public.representative_personal_details WHERE representative_id = :'test_id'), 'moderator reads personal fields');
DO $$ BEGIN
  BEGIN PERFORM public.save_state_representative(NULL, 'jalisco', '', 'Unauthorized', 'unauthorized@example.test', NULL, true, NULL, NULL, NULL, NULL); RAISE EXCEPTION 'expected moderator write denial';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('test.role', 'user', true);
SELECT pg_temp.assert_true((SELECT count(*) = 33 FROM public.state_representatives), 'ordinary user sees only active contacts');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.representative_personal_details), 'ordinary user cannot read personal fields');
DO $$ BEGIN
  BEGIN PERFORM public.save_state_representative(NULL, 'jalisco', '', 'Unauthorized', 'unauthorized@example.test', NULL, true, NULL, NULL, NULL, NULL); RAISE EXCEPTION 'expected user write denial';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.assert_true((SELECT count(*) = 33 FROM public.state_representatives), 'anonymous sees active contacts');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.representative_personal_details), 'anonymous cannot read personal fields');
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.save_state_representative(uuid,text,text,text,text,text,boolean,text,text,text,timestamptz)', 'EXECUTE'), 'anonymous RPC blocked');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('test.role', 'admin', true);
SELECT updated_at AS current_version FROM public.state_representatives WHERE id = :'test_id' \gset
SELECT public.save_state_representative(:'test_id', 'jalisco', 'Prueba', 'Representante editado', 'prueba@example.test', NULL, true, 'Conyuge editado', '01-01', NULL, :'current_version');
SELECT pg_temp.assert_true((SELECT is_active FROM public.state_representatives WHERE id = :'test_id'), 'reactivation');
RESET ROLE;
ROLLBACK;
