import { randomBytes } from "node:crypto";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallback = "item",
): Promise<string> {
  const base = slugify(name) || fallback;
  let slug = base;

  while (await isTaken(slug)) {
    slug = `${base}-${randomBytes(3).toString("hex")}`;
  }

  return slug;
}
