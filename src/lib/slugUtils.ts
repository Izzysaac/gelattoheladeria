/**
 * SLUG UTILS
 * Single source of truth for slug normalization
 * Used everywhere: routing, search, URLs
 */

export function toSlug(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ñ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
