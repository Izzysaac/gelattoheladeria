export function formatFromThousands(value) {
    const num = Number(value);

    if (isNaN(num)) return "";

    return Math.floor(num / 1000).toString();
}

export const toSlugPage = (text) => {
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