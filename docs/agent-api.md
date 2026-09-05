# Agent API

Simple Planner is a local-first timeline. Agents read and write **plan items** through JSON (Copy for AI, backups) or the MCP stdio server in `packages/mcp`.

Always go through the domain (`createItem`, `updateItem`, `completeItem`, `addSubtask`). Do not invent fields. Dates are local civil strings, never UTC instants.

## Documents

| Resource | Path |
|---|---|
| JSON Schema (AppData v3) | [`/schema/planner.schema.json`](../schema/planner.schema.json) |
| This API | [`/docs/agent-api.md`](./agent-api.md) |

Copied JSON includes `"$schema": "/schema/planner.schema.json"` and `"version": 3`.

## Model

- **Plan**: what the UI calls a *calendar* (one area of life, business or project). `id`, `title`, optional `color` (hex), inclusive `start` / `end` as `YYYY-MM-DD`.
- **PlanItem**: one timed entity. `kind` is `task` | `event` | `objective`.
- **Hierarchy**: objective > (task | event); task > subtask; event > prep task. A task whose `parentId` is a task is a *subtask* and stays inside its parent on the calendar.
- **`end` absent**: a point in time (milestone). Do not copy `end` from `start`.
- **`start` / `end`**: `YYYY-MM-DD` (all-day) or `YYYY-MM-DDTHH:mm` (timed). Local, not shifted by timezone.
- **`recurrence`**: RFC 5545 RRULE body (`FREQ=WEEKLY;BYDAY=MO,WE`). Date-only `UNTIL=YYYYMMDD` is the last civil day, exclusive at next midnight locally.
- **`recurrenceExceptions`**: occurrence starts removed from a series (EXDATE).
- **`executor`**: `human` | `ai`. Agents work items with `executor: "ai"`.
- **`agentBrief`**: instructions for an AI executor.
- **`parentId`**: tree. An event may only belong to an objective. An event may have task children (prep). An item cannot be parented under its descendant.
- **People / categories**: referenced by id on `assigneeIds`, `attendeeIds`, `categoryId`.

## Invariants

- `end` must not be before `start`.
- Events may only parent to an objective. Only tasks may nest under an event.
- Status: `pending` | `in-progress` | `completed` | `cancelled` | `blocked`. Completing sets `completedAt`.
- Writes validate with zod before persistence.

## Inbox filter

The work queue for an agent:

```
executor = "ai"
AND status IN ("pending", "in-progress")
```

Optional: `planId`, `from` / `to` as local datetimes, `assigneeId`.

## MCP tools

Run against a backup file (does not open IndexedDB):

```bash
pnpm --filter @planner/mcp start -- --file path/to/backup.json
```

| Tool | Role |
|---|---|
| `list_plans` | All plans |
| `list_items` | Filter: `planId`, `kind`, `executor`, `status`, `from`, `to`, `assigneeId` |
| `search_items` | `query` on title/notes, plus the same filters |
| `get_item` | One item, wrapped with `$schema` |
| `create_item` | Domain create then persist |
| `update_item` | Patch allowed fields (`title`, `notes`, `start`, `end`, `status`, …) |
| `complete_item` | Mark completed |
| `add_subtask` | Child of a task or objective |

## Example

```json
{
  "$schema": "/schema/planner.schema.json",
  "version": 3,
  "items": [
    {
      "id": "task-ai",
      "planId": "plan-1",
      "kind": "task",
      "title": "Draft the launch note",
      "notes": "",
      "start": "2026-09-18",
      "end": "2026-09-22",
      "status": "pending",
      "energy": "low",
      "executor": "ai",
      "agentBrief": "Write a 200-word launch note in English.",
      "assigneeIds": [],
      "attendeeIds": []
    }
  ]
}
```

List the inbox:

```json
{ "planId": "plan-1", "executor": "ai", "status": ["pending", "in-progress"] }
```
