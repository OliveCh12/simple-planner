import { describe, expect, it } from "vitest";
import { DomainError } from "@/lib/domain/items";
import { createPerson, updatePerson } from "@/lib/domain/people";

describe("createPerson", () => {
  it("defaults a human with a swatch color", () => {
    const person = createPerson({ name: "  Ada  " });
    expect(person).toMatchObject({
      name: "Ada",
      kind: "human",
      color: "#16a34a",
    });
    expect(person.email).toBeUndefined();
  });

  it("normalizes a short hex color", () => {
    expect(createPerson({ name: "Ada", color: "#0F0" }).color).toBe("#00ff00");
  });

  it("rejects an empty name", () => {
    expect(() => createPerson({ name: "  " })).toThrow(DomainError);
  });

  it("rejects a bad color", () => {
    expect(() => createPerson({ name: "Ada", color: "green" })).toThrow(/hex color/);
  });

  it("rejects a malformed email", () => {
    expect(() => createPerson({ name: "Ada", email: "not-an-email" })).toThrow(DomainError);
  });
});

describe("updatePerson", () => {
  it("clears email when blank", () => {
    const person = createPerson({ name: "Ada", email: "ada@example.com", kind: "agent" });
    expect(updatePerson(person, { email: "  " }).email).toBeUndefined();
    expect(updatePerson(person, { kind: "human" }).kind).toBe("human");
  });
});
