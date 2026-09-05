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

- **Plan**: a *calendar* (personal, work, or an external feed). Optional `source` (`local` \| `google` \| `icloud` \| `caldav`).
- **PlanItem**: `kind` is `task` | `event` | `project` | `objective`. An event is a dated moment; a project is a bounded initiative made of tasks; an objective is a broader direction that can group projects.
- **Hierarchy**: objective > (project | task | event); project > (task | event); event > prep task; task > subtask. Events may have no parent. A task on the grid only when it is scheduled as a real slot (timed or a short all-day date).
- **`start` absent**: unscheduled. Allowed for tasks, projects and objectives; events always have a `start`. Unscheduled tasks appear in Plan (inbox when they have no parent, link or deadline; otherwise “to schedule”).
- **`due`**: deadline `YYYY-MM-DD`, independent of the slot. Tasks and projects only.
- **`linkedIds`**: contextual links to events, projects or goals beyond the tree.
- **`end` absent**: a point in time (milestone). Do not copy `end` from `start`.
- **`start` / `end`**: `YYYY-MM-DD` (all-day) or `YYYY-MM-DDTHH:mm` (timed). Local, not shifted by timezone.
- **`recurrence`**: RFC 5545 RRULE body (`FREQ=WEEKLY;BYDAY=MO,WE`). Date-only `UNTIL=YYYYMMDD` is the last civil day, exclusive at next midnight locally.
- **`recurrenceExceptions`**: occurrence starts removed from a series (EXDATE).
- **`executor`**: `human` | `ai`. Agents work items with `executor: "ai"`.
- **`agentBrief`**: instructions for an AI executor.
- **`parentId`**: tree, one parent at most. An event may belong to an objective or a project. Only tasks may nest under an event or a task. An item cannot be parented under its descendant.
- **`externalId` / `sync`**: present on events mirrored from a provider; `sync.state` is `synced` | `pending` | `conflict`.
- **People / categories**: referenced by id on `assigneeIds`, `attendeeIds`, `categoryId`.
- **`location`**: `{ name, address?, url?, lat?, lon?, timezone?, country? }`. Coordinates come from a picked suggestion (Open-Meteo geocoding) and unlock forecasts and sunrise/sunset for that item; a bare `name` is fine for "Online".
- **`settings.environment`**: `{ weather, eventWeather, daylight, units, detail, location? }`. All display-only; nothing is fetched without a place.

## Invariants

- `end` must not be before `start`; `end` and `recurrence` need a `start`.
- Events need a `start` and never carry `due`. Only tasks may nest under an event or a task. Planning never syncs to Google or iCloud.
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
| `add_subtask` | Child of a goal, project, event or task (unscheduled unless `start` is given) |

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
