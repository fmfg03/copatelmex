const HIDDEN_MEDIA_CATEGORY_NAMES = new Set(["femenil", "varonil", "juvenil"]);

const normalizeCategoryName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const isVisibleMediaCategory = (category: { name?: string | null } | null | undefined) => {
  const name = category?.name;
  if (!name) return false;
  return !HIDDEN_MEDIA_CATEGORY_NAMES.has(normalizeCategoryName(name));
};
