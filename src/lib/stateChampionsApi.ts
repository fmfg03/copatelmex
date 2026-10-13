import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ChampionEntry, ChampionPhotos, PublishedChampion } from "@/lib/stateChampions";

function championApiError(error: { code?: string; message?: string }, fallback: string): Error {
  const messages: Record<string, string> = {
    "40001": "Otro administrador modificó este estado. Recarga los datos antes de guardar o publicar.",
    "23505": "Este estado ya existe. Recarga los datos y edita su registro actual.",
    "42501": "Necesitas una sesión vigente con permisos de administrador.",
    PGRST301: "Tu sesión venció. Inicia sesión nuevamente.",
    PGRST302: "Necesitas iniciar sesión con permisos de administrador.",
    "22023": "Revisa las imágenes y su encuadre. Para publicar se necesitan las tres categorías completas.",
    P0002: "Este estado ya no está disponible. Recarga los datos.",
  };
  return new Error(messages[error.code ?? ""] ?? fallback);
}

// Server RPCs validate category, state, assets, publication and version checks.
export async function fetchAdminChampions(): Promise<ChampionEntry[]> {
  const { data, error } = await supabase.from("state_champions").select("*").order("state");
  if (error) throw championApiError(error, "No se pudieron cargar los campeones. Intenta de nuevo.");
  return (data ?? []) as unknown as ChampionEntry[];
}

export async function fetchPublishedChampions(): Promise<PublishedChampion[]> {
  const { data, error } = await supabase.rpc("get_published_state_champions");
  if (error) throw championApiError(error, "No se pudieron cargar los campeones publicados. Intenta de nuevo.");
  return (data ?? []) as unknown as PublishedChampion[];
}

export async function saveChampionDraft(input: {
  id?: string;
  state: string;
  draft: ChampionPhotos;
  expectedUpdatedAt?: string;
}): Promise<ChampionEntry> {
  const { data, error } = await supabase.rpc("save_state_champion_draft", {
    p_state: input.state,
    p_draft: input.draft as unknown as Json,
    ...(input.id ? { p_id: input.id } : {}),
    ...(input.expectedUpdatedAt ? { p_expected_updated_at: input.expectedUpdatedAt } : {}),
  }).single();
  if (error) throw championApiError(error, "No se pudieron guardar los cambios. Intenta de nuevo.");
  return data as unknown as ChampionEntry;
}

export async function publishChampion(id: string, expectedUpdatedAt: string): Promise<ChampionEntry> {
  const { data, error } = await supabase.rpc("publish_state_champion", {
    p_id: id, p_expected_updated_at: expectedUpdatedAt,
  }).single();
  if (error) throw championApiError(error, "No se pudieron guardar los cambios. Intenta de nuevo.");
  return data as unknown as ChampionEntry;
}

export async function withdrawChampion(id: string, expectedUpdatedAt: string): Promise<ChampionEntry> {
  const { data, error } = await supabase.rpc("withdraw_state_champion", {
    p_id: id, p_expected_updated_at: expectedUpdatedAt,
  }).single();
  if (error) throw championApiError(error, "No se pudieron guardar los cambios. Intenta de nuevo.");
  return data as unknown as ChampionEntry;
}
