import { representativeStates } from "./representativeStates.ts";

export interface RepresentativeContact {
  id: string;
  state_slug: string;
  zone: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  updated_at: string;
}
export interface PersonalDetails {
  spouse_name: string | null;
  representative_birthday: string | null;
  spouse_birthday: string | null;
}
export type Representative = RepresentativeContact & { representative_personal_details: PersonalDetails | null };
export interface RepresentativeForm {
  state_slug: string;
  zone: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  spouse_name: string;
  representative_birthday: string;
  spouse_birthday: string;
}
export const emptyRepresentativeForm: RepresentativeForm = {
  state_slug: "", zone: "", name: "", email: "", phone: "", is_active: true,
  spouse_name: "", representative_birthday: "", spouse_birthday: "",
};
export function birthdayToStorage(value: string): string | null {
  if (!value.trim()) return null;
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("El cumpleaños debe tener formato DD/MM.");
  const day = Number(match[1]), month = Number(match[2]);
  const date = new Date(Date.UTC(2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("El cumpleaños debe ser una fecha válida.");
  }
  return `${match[2]}-${match[1]}`;
}
export function birthdayToDisplay(value?: string | null): string {
  return value ? `${value.slice(3, 5)}/${value.slice(0, 2)}` : "";
}
export function stateName(slug: string): string {
  return representativeStates.find(state => state.slug === slug)?.name || slug;
}
export function formFromRepresentative(row: Representative): RepresentativeForm {
  return {
    state_slug: row.state_slug, zone: row.zone, name: row.name, email: row.email,
    phone: row.phone || "", is_active: row.is_active,
    spouse_name: row.representative_personal_details?.spouse_name || "",
    representative_birthday: birthdayToDisplay(row.representative_personal_details?.representative_birthday),
    spouse_birthday: birthdayToDisplay(row.representative_personal_details?.spouse_birthday),
  };
}
export function saveRepresentativeArgs(form: RepresentativeForm, row: Representative | null) {
  if (!representativeStates.some(state => state.slug === form.state_slug)) throw new Error("Selecciona un estado válido.");
  if (!form.name.trim() || form.name.trim().length > 200) throw new Error("El nombre es obligatorio y admite hasta 200 caracteres.");
  if (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) throw new Error("Ingresa un correo válido.");
  if (form.zone.trim().length > 120 || form.spouse_name.trim().length > 200) throw new Error("La zona o el nombre del cónyuge exceden la longitud permitida.");
  if (form.phone.trim() && (form.phone.trim().length > 40 || !/^[0-9+() .-]+$/.test(form.phone.trim()) || !/[0-9]/.test(form.phone))) throw new Error("Ingresa un teléfono válido.");
  return {
    p_id: row?.id || null, p_expected_updated_at: row?.updated_at || null,
    p_state_slug: form.state_slug, p_zone: form.zone.trim(), p_name: form.name.trim(),
    p_email: form.email.trim().toLowerCase(), p_phone: form.phone.trim() || null,
    p_is_active: form.is_active, p_spouse_name: form.spouse_name.trim() || null,
    p_representative_birthday: birthdayToStorage(form.representative_birthday),
    p_spouse_birthday: birthdayToStorage(form.spouse_birthday),
  };
}
export function filterRepresentatives(rows: Representative[], search: string, state: string, status: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const needle = normalize(search.trim());
  return rows.filter(row => (state === "all" || row.state_slug === state)
    && (status === "all" || row.is_active === (status === "active"))
    && normalize(`${row.name} ${stateName(row.state_slug)} ${row.zone} ${row.email}`).includes(needle));
}
export function groupPublicContacts(rows: RepresentativeContact[]) {
  const groups: Record<string, RepresentativeContact[]> = {};
  for (const row of rows) {
    if (row.is_active) (groups[row.state_slug] ||= []).push(row);
  }
  return groups;
}
