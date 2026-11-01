export const EVENT_CATEGORIES = [
  { slug: "seni-budaya", label: "Seni & Budaya" },
  { slug: "atraksi", label: "Atraksi" },
  { slug: "edukasi", label: "Edukasi" },
  { slug: "musik", label: "Musik" },
  { slug: "outdoor", label: "Outdoor" },
] as const;

export type EventCategorySlug = (typeof EVENT_CATEGORIES)[number]["slug"];

export const EVENT_CATEGORY_SLUGS: string[] = EVENT_CATEGORIES.map((c) => c.slug);

export function sanitizeCategories(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(input.filter((s): s is string => typeof s === "string"));
  return EVENT_CATEGORY_SLUGS.filter((slug) => set.has(slug));
}
