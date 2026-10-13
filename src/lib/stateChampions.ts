export const CHAMPION_CATEGORIES = ["varonil", "juvenil", "femenil"] as const;
export type ChampionCategory = typeof CHAMPION_CATEGORIES[number];
export const CHAMPION_LABELS: Record<ChampionCategory, string> = {
  varonil: "Varonil", juvenil: "Juvenil", femenil: "Femenil",
};
export const CHAMPION_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
] as const;
export const CHAMPION_BUCKET = "gallery-media";
export const MAX_CHAMPION_IMAGE_BYTES = 10 * 1024 * 1024;
export const CHAMPION_ROTATION_MS = 6000;
export type ChampionFraming = { zoom: number; x: number; y: number };
export const DEFAULT_CHAMPION_FRAMING: ChampionFraming = { zoom: 1, x: 50, y: 50 };
export type ChampionPhoto = {
  original_path: string;
  image_path: string;
  framing: ChampionFraming;
};
export type ChampionPhotos = Partial<Record<ChampionCategory, ChampionPhoto>>;
export type ChampionEntry = {
  id: string;
  state: string;
  draft: ChampionPhotos;
  published: ChampionPhotos | null;
  updated_at: string;
  published_at: string | null;
};
export type PublishedChampion = { id: string; state: string; photos: ChampionPhotos };

export function completeChampionPhotos(photos: ChampionPhotos): boolean {
  return CHAMPION_CATEGORIES.every((category) => Boolean(photos[category]?.image_path && photos[category]?.original_path));
}

export function sortChampions<T extends { state: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.state.localeCompare(b.state, "es"));
}

export function validateChampionImage(file: Pick<File, "type" | "size">): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Solo se permiten imágenes JPG, PNG o WebP.";
  }
  if (file.size === 0) return "La imagen está vacía.";
  if (file.size > MAX_CHAMPION_IMAGE_BYTES) return "La imagen no debe superar 10 MB.";
  return null;
}

// At zoom 1 the complete team stays visible; zooming crops only when requested.
export function championImagePlacement(width: number, height: number, framing: ChampionFraming) {
  if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw new Error("La imagen no tiene dimensiones válidas.");
  if (![framing.zoom, framing.x, framing.y].every(Number.isFinite)
    || framing.zoom < 1 || framing.zoom > 3 || framing.x < 0 || framing.x > 100 || framing.y < 0 || framing.y > 100) {
    throw new Error("El encuadre no es válido.");
  }
  const scale = Math.min(900 / width, 600 / height) * framing.zoom;
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  return { width: drawWidth, height: drawHeight, x: (900 - drawWidth) * framing.x / 100, y: (600 - drawHeight) * framing.y / 100 };
}
