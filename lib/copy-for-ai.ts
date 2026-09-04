import type { Category, Person, Plan, PlanItem } from "@/types";

const SCHEMA_HREF = "/schema/planner.schema.json";

export function itemDocumentForAi(item: PlanItem) {
  return {
    $schema: SCHEMA_HREF,
    version: 3 as const,
    items: [item],
  };
}

export function planDocumentForAi(input: {
  plan: Plan;
  items: PlanItem[];
  people: Person[];
  categories: Category[];
}) {
  const personIds = new Set(input.items.flatMap((item) => [...item.assigneeIds, ...item.attendeeIds]));
  const categoryIds = new Set(input.items.map((item) => item.categoryId).filter(Boolean));
  return {
    $schema: SCHEMA_HREF,
    version: 3 as const,
    plans: [input.plan],
    items: input.items,
    people: input.people.filter((person) => personIds.has(person.id)),
    categories: input.categories.filter((category) => categoryIds.has(category.id)),
  };
}

export function serializeForAi(document: unknown): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
