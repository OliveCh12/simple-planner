import { createId } from "@/lib/id";
import { DomainError } from "@/lib/domain/items";
import { DEFAULT_SWATCH, normalizeHex } from "@/lib/colors";
import { categorySchema } from "@/lib/validation";
import type { Category } from "@/types";

export function parseCategory(category: Category): Category {
  const parsed = categorySchema.safeParse(category);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DomainError(first?.message ?? "Invalid category");
  }
  return { ...parsed.data, color: normalizeHex(parsed.data.color) };
}

export function createCategory(input: {
  name: string;
  color?: string;
  icon?: string;
  id?: string;
}): Category {
  const category: Category = {
    id: input.id ?? createId(),
    name: input.name.trim(),
    color: normalizeHex(input.color ?? DEFAULT_SWATCH),
  };
  const icon = input.icon?.trim();
  if (icon) category.icon = icon;
  return parseCategory(category);
}

export function updateCategory(category: Category, patch: Partial<Omit<Category, "id">>): Category {
  const next: Category = { ...category, ...patch, id: category.id };
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.color !== undefined) next.color = normalizeHex(patch.color);
  if (patch.icon !== undefined) {
    const icon = patch.icon.trim();
    if (icon) next.icon = icon;
    else delete next.icon;
  }
  return parseCategory(next);
}
