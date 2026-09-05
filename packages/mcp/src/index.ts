import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  addSubtaskTool,
  completeItemTool,
  createItemTool,
  getItem,
  listItems,
  listPlans,
  searchItems,
  toAgentJson,
  updateItemTool,
} from "@/lib/agent/tools";
import { MemoryRepository } from "@/lib/repository/memory";
import { parseAppData } from "@/lib/validation";

const kindSchema = z.enum(["task", "event", "project", "objective"]);
const executorSchema = z.enum(["human", "ai"]);
const statusSchema = z.enum(["pending", "in-progress", "completed", "cancelled", "blocked"]);
const oneOrMany = <T extends z.ZodType>(schema: T) => z.union([schema, z.array(schema)]);

function fileArg(argv: string[]): string | undefined {
  const index = argv.indexOf("--file");
  if (index >= 0) return argv[index + 1];
  const eq = argv.find((arg) => arg.startsWith("--file="));
  return eq?.slice("--file=".length);
}

async function repositoryFromFile(filePath: string) {
  const data = parseAppData(readFileSync(resolve(filePath), "utf8"));
  const repo = new MemoryRepository();
  await repo.importAll(data);
  return repo;
}

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: toAgentJson(value) }] };
}

async function main() {
  const file = fileArg(process.argv.slice(2));
  if (!file) {
    console.error("Usage: planner-mcp --file backup.json");
    process.exit(1);
  }

  const repo = await repositoryFromFile(file);
  const server = new McpServer({ name: "simple-planner", version: "0.1.0" });

  server.registerTool("list_plans", { description: "List all plans (the calendars shown in the UI)." }, async () => text(await listPlans(repo)));

  server.registerTool(
    "list_items",
    {
      description:
        "List items. For the AI inbox pass executor=ai and status pending and in-progress.",
      inputSchema: z.object({
        planId: z.string().optional(),
        kind: oneOrMany(kindSchema).optional(),
        executor: oneOrMany(executorSchema).optional(),
        status: oneOrMany(statusSchema).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        assigneeId: z.string().optional(),
      }),
    },
    async (filter) => text(await listItems(repo, filter))
  );

  server.registerTool(
    "search_items",
    {
      description: "Search item titles and notes.",
      inputSchema: z.object({
        query: z.string(),
        planId: z.string().optional(),
        kind: oneOrMany(kindSchema).optional(),
        executor: oneOrMany(executorSchema).optional(),
        status: oneOrMany(statusSchema).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        assigneeId: z.string().optional(),
      }),
    },
    async (input) => text(await searchItems(repo, input))
  );

  server.registerTool(
    "get_item",
    {
      description: "Get one item as a v3 document with $schema.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const document = await getItem(repo, id);
      if (!document) return { content: [{ type: "text", text: "Item not found" }], isError: true };
      return text(document);
    }
  );

  server.registerTool(
    "create_item",
    {
      description: "Create an item via the domain.",
      inputSchema: z.object({
        planId: z.string(),
        title: z.string(),
        start: z.string().optional(),
        end: z.string().optional(),
        due: z.string().optional(),
        kind: kindSchema.optional(),
        notes: z.string().optional(),
        parentId: z.string().optional(),
        linkedIds: z.array(z.string()).optional(),
        executor: executorSchema.optional(),
        categoryId: z.string().optional(),
        recurrence: z.string().optional(),
        agentBrief: z.string().optional(),
      }),
    },
    async (input) => text(await createItemTool(repo, input))
  );

  server.registerTool(
    "update_item",
    {
      description: "Patch an existing item.",
      inputSchema: z.object({
        id: z.string(),
        title: z.string().optional(),
        notes: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        due: z.string().optional(),
        parentId: z.string().optional(),
        linkedIds: z.array(z.string()).optional(),
        status: statusSchema.optional(),
        executor: executorSchema.optional(),
        agentBrief: z.string().optional(),
        categoryId: z.string().optional(),
      }),
    },
    async ({ id, ...patch }) => {
      const next = await updateItemTool(repo, id, patch);
      if (!next) return { content: [{ type: "text", text: "Item not found" }], isError: true };
      return text(next);
    }
  );

  server.registerTool(
    "complete_item",
    {
      description: "Mark an item completed.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const next = await completeItemTool(repo, id);
      if (!next) return { content: [{ type: "text", text: "Item not found" }], isError: true };
      return text(next);
    }
  );

  server.registerTool(
    "add_subtask",
    {
      description: "Add a child under a goal, project, event or task. Unscheduled unless a start is given.",
      inputSchema: z.object({
        parentId: z.string(),
        title: z.string(),
        start: z.string().optional(),
        end: z.string().optional(),
        due: z.string().optional(),
        kind: kindSchema.optional(),
      }),
    },
    async ({ parentId, ...input }) => {
      const child = await addSubtaskTool(repo, parentId, input);
      if (!child) return { content: [{ type: "text", text: "Parent not found" }], isError: true };
      return text(child);
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main();
