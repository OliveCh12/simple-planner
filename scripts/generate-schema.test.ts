import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { appDataSchemaV3 } from "@/lib/validation";

const outFile = path.resolve(__dirname, "../schema/planner.schema.json");

describe("JSON Schema", () => {
  it("writes schema/planner.schema.json from the v3 zod schema", () => {
    const schema = z.toJSONSchema(appDataSchemaV3);
    mkdirSync(path.dirname(outFile), { recursive: true });
    writeFileSync(outFile, `${JSON.stringify(schema, null, 2)}\n`);
    const written = JSON.parse(readFileSync(outFile, "utf8")) as { type?: string };
    expect(written.type).toBe("object");
  });
});
