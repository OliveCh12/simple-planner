import { createId } from "@/lib/id";
import { DomainError } from "@/lib/domain/items";
import { DEFAULT_SWATCH, normalizeHex } from "@/lib/colors";
import { personSchema } from "@/lib/validation";
import type { Person } from "@/types";

export function parsePerson(person: Person): Person {
  const parsed = personSchema.safeParse(person);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DomainError(first?.message ?? "Invalid person");
  }
  const data = { ...parsed.data };
  if (data.color) data.color = normalizeHex(data.color);
  return data;
}

export function createPerson(input: {
  name: string;
  kind?: Person["kind"];
  email?: string;
  color?: string;
  id?: string;
}): Person {
  const person: Person = {
    id: input.id ?? createId(),
    name: input.name.trim(),
    kind: input.kind ?? "human",
  };
  const email = input.email?.trim();
  if (email) person.email = email;
  if (input.color) person.color = normalizeHex(input.color);
  else person.color = DEFAULT_SWATCH;
  return parsePerson(person);
}

export function updatePerson(person: Person, patch: Partial<Omit<Person, "id">>): Person {
  const next: Person = { ...person, ...patch, id: person.id };
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.email !== undefined) {
    const email = patch.email.trim();
    if (email) next.email = email;
    else delete next.email;
  }
  if (patch.color !== undefined) next.color = normalizeHex(patch.color);
  return parsePerson(next);
}
