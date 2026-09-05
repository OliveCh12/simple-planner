# Calendars, planning, and sync

This app is two experiences over one dataset.

- **Calendar** answers “what is planned in time?”
- **Plan** answers “what must I accomplish, why, and what is the next action?”

They share the data and must not collapse into each other: the calendar never becomes a task dump, Plan never becomes a second calendar.

## Concepts

| Thing | Role | On the grid? |
|---|---|---|
| **Calendar** (`Plan` row) | A context in time: personal, work, family, or a Google / iCloud feed. | It *is* the grid. |
| **Event** | A dated moment: a lunch, a flight, a standup, a trip. Fully standalone. | Always, if it falls in view. |
| **Project** | A bounded initiative: build a cabin, ship a release, prepare a trip. Holds tasks and relevant events. | Never as a chip; in the plan strip and pane. Its deadline shows as a marker. |
| **Objective** | A broader result or direction: better health, grow the business. Can group several projects. | Never as a chip; in the plan strip and pane. |
| **Task** | A concrete action. Independent, or under a project, an event, an objective, or a task (subtask). | Only when scheduled as a real slot (timed, or a short all-day date). Its deadline shows as a marker. |
| **Subtask** | A step inside a task. Follows its parent. | Only with its own timed slot. |

An event **never** requires a parent. A project or an objective is optional context, never a form to fill.

### Time on an item

- `start` / `end`: the slot on the calendar. **Optional** for tasks, projects and objectives. Required for events.
- `due`: a deadline (`YYYY-MM-DD`) independent of the slot. Tasks and projects. The calendar shows it as a **Due** marker; dragging the marker moves the deadline.
- No `start` = **unscheduled**. Unscheduled work lives in Plan (inbox or “to schedule”) and in the calendar's plan pane when its project, deadline or linked event is in view. It never clutters the grid.

### Links

- `parentId`: one primary parent. objective > (project | task | event); project > (task | event); event > prep task; task > subtask. Enforced by `canParent`.
- `linkedIds`: contextual links beyond the tree — a task that prepares an event while belonging to a project, an event that matters to a second project. Flat list, no graph semantics.

## Plan (the space)

`/plan` shows every calendar's items with four views:

| View | Contents |
|---|---|
| **Inbox** | Tasks with no slot, no deadline, no parent and no link: captured, not clarified. |
| **To schedule** | Open tasks with no slot that already have a home (project, goal, event, link) or a deadline. |
| **Projects** | Objectives > projects > tasks > subtasks as an outline; loose projects too. |
| **All tasks** | Everything, with search, filters (calendar, project, status, category, assignee, deadline, slot), grouping, sort, bulk actions and saved views. |

The calendar's left pane stays contextual: goals and projects active in the period, prep before the period's events, and a capped list of work to schedule with a link to Plan for the rest. Its unscheduled rows can be **placed**: pick one, click a slot.

Capture is one keystroke away (⌘K) anywhere: a task with no day, time or rhythm in its text goes to the inbox; name one and it lands on the calendar.

## Multiple calendars

Each `Plan` may carry a `source`:

```ts
{ provider: "local" | "google" | "icloud" | "caldav", access: "readwrite" | "readonly", account?, externalId?, lastSyncedAt? }
```

Local is the default. Events on a read-only source cannot be edited; projects, objectives and tasks on that same calendar stay writable here.

The editor always says where an item lives and what a save does: *Local calendar*, *Google · in sync*, *Google · syncs on next sync*, *Google · read-only*, *changed on both sides*. Items that mirror a provider event carry `externalId` and `sync: { state, etag?, syncedAt? }`.

## Sync strategy (progressive)

Do not promise feature parity. The platforms are not equal.

### Pieces already in place

- `lib/sync/adapter.ts`: the `CalendarAdapter` contract (`pull`, `create`, `update`, `remove`), a `LocalAdapter`, and unconnected placeholders that say what is missing.
- `lib/sync/mapping.ts`: `toExternalEvent` (event body only, never the tree), `fromExternalEvent` (remote body wins, local planning links survive), `reconcile` (create / update / push / conflict / cancel), `describeSync` for the UI.
- Nothing synced is turned into a task automatically. The editor offers explicit moves: add a prep task, link to a project or goal, or keep the event as it is.

### 1. Local (now)

Everything lives in IndexedDB. This is the source of truth for planning.

### 2. Google Calendar (next)

- OAuth 2, Calendar API v3, `events.list` with a stored `nextSyncToken`.
- HTTP 410 on the token → full resync.
- Map Google events ↔ `PlanItem` of `kind: "event"` with `externalId`.
- **Do not** push objectives, projects or tasks to Google (Google CalDAV does not expose VTODO anyway).
- Two-way for events only, on calendars the user opted in.

### 3. iCloud Calendar (after Google)

- CalDAV at `caldav.icloud.com`, Apple **app-specific password**.
- No webhooks: poll with `sync-collection`. Updates are a full iCalendar PUT.
- ICS subscribe URLs are read-only and often hours late — only for a watch-only calendar (`access: "readonly"`).

### 4. Other CalDAV

Same stack as iCloud (Nextcloud, Fastmail). Capability-detect; degrade to read-only when write fails.

### Conflict rule

Last writer on the **event** body wins on the provider. Planning links (`parentId`, `linkedIds`, tasks) live only in this app and are never overwritten by a remote event payload. If a remote event is deleted, keep local prep tasks and mark the event cancelled, do not cascade-delete planning. When both sides changed since the last sync, the item is flagged `conflict` and the user decides.

### What we will not do

- Mirror Google into iCloud or the reverse inside this app.
- Upload the task tree to any provider.
- Silently edit a read-only event.
- Turn every synced event or email into a task.
