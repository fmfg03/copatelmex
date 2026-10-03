import test from 'node:test';
import assert from 'node:assert/strict';
import { birthdayToStorage, birthdayToDisplay, saveRepresentativeArgs, emptyRepresentativeForm, filterRepresentatives, groupPublicContacts, formFromRepresentative } from '../src/lib/representativeDirectory.ts';
const form = { ...emptyRepresentativeForm, state_slug: 'estado-de-mexico', name: ' Juliana Martín ', email: ' ASOC_MEX@YAHOO.COM.MX ' };
const row = { id: 'test-id', state_slug: 'estado-de-mexico', name: 'Juliana Martín', zone: 'Valle de México', email: 'asoc_mex@yahoo.com.mx', phone: null, is_active: true, updated_at: '2026-10-04T12:00:00Z', representative_personal_details: { spouse_name: 'Persona', representative_birthday: '02-29', spouse_birthday: '12-31' } };
test('birthdays accept blank and leap day without a year, reject impossible dates', () => {
  assert.equal(birthdayToStorage(''), null);
  assert.equal(birthdayToStorage('29/02'), '02-29');
  assert.equal(birthdayToStorage('31/12'), '12-31');
  for (const value of ['31/04', '30/02', '00/01', '01/00', '01/13', '1/1', '2020-01-01', '01/01/2000']) assert.throws(() => birthdayToStorage(value));
  assert.equal(birthdayToDisplay('02-29'), '29/02');
});
test('create and edit preserve optional fields, trim input and include concurrency token', () => {
  const args = saveRepresentativeArgs(form, null);
  assert.equal(args.p_name, 'Juliana Martín'); assert.equal(args.p_email, 'asoc_mex@yahoo.com.mx');
  assert.equal(args.p_spouse_name, null); assert.equal(args.p_representative_birthday, null); assert.equal(args.p_id, null);
  const edited = saveRepresentativeArgs(formFromRepresentative(row), row);
  assert.equal(edited.p_id, row.id); assert.equal(edited.p_expected_updated_at, row.updated_at);
  assert.equal(edited.p_representative_birthday, '02-29'); assert.equal(edited.p_spouse_name, 'Persona');
});
test('rejects missing name, invalid email, unknown state and invalid phone', () => {
  for (const patch of [{ name: ' ' }, { email: 'bad' }, { state_slug: 'fake' }, { phone: 'abc' }, { phone: '+' }, { zone: 'x'.repeat(121) }]) assert.throws(() => saveRepresentativeArgs({ ...form, ...patch }, null));
});
test('search tolerates accents and filters state and active status', () => {
  const rows = [row, { ...row, id: 'inactive', is_active: false }];
  assert.equal(filterRepresentatives(rows, 'martin', 'all', 'active').length, 1);
  assert.equal(filterRepresentatives(rows, 'mexico', 'estado-de-mexico', 'inactive').length, 1);
  assert.equal(filterRepresentatives(rows, '', 'jalisco', 'all').length, 0);
});
test('public grouping preserves multiple zones and excludes inactive contacts', () => {
  const rows = [row, { ...row, id: 'toluca', zone: 'Valle de Toluca' }, { ...row, id: 'inactive', is_active: false }];
  assert.deepEqual(groupPublicContacts(rows)['estado-de-mexico'].map(item => item.id), ['test-id', 'toluca']);
});
