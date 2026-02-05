export async function loadHeroOverride(restaurantId: string) {
  try {
    return (await import(`../overrides/${restaurantId}/Hero.astro`)).default;
  } catch {
    return null;
  }
}
