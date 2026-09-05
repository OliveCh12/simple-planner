# Calendars, planning, and sync

This app is two layers on one screen.

- **The grid** answers “what is on the clock?”
- **Plan** (the left pane) answers “what matters, and what is the next action?”

They must not collapse into each other.

## Concepts

| Thing | Role | On the grid? |
|---|---|---|
| **Calendar** (`Plan`) | A context in time: personal, work, family, or a Google / iCloud feed. | It *is* the grid. |
| **Event** | A dated fact. A lunch, a flight, a standup. | Always, if it falls in view. |
| **Objective** | A desired result over a period. This is also how we model a “project”. | Never as a day chip. |
| **Task** | A concrete action. May hang off an objective, an event, both (via the tree), or nothing. | Only when it is a real slot (timed, or a short all-day date). |
| **Subtask** | A step inside a task. | Only with its own timed slot. |

There is **no fourth kind called project**. A project is an objective with tasks. Adding another type would force a family dinner through fields it does not need.

An event **never** requires a parent. Links are explicit (`parentId`), never inferred from category.

## Multiple calendars

Each `Plan` may carry a `source`:

```ts
{ provider: "local" | "google" | "icloud" | "caldav", access: "readwrite" | "readonly", account?, externalId?, lastSyncedAt? }
```

Local is the default. Events on a read-only source cannot be edited; objectives and tasks on that same calendar stay writable here.

Creating an event always writes to the **open** calendar. The editor states the source.

## Sync strategy (progressive)

Do not promise feature parity. The platforms are not equal.

### 1. Local (now)

Everything lives in IndexedDB. This is the source of truth for planning.

### 2. Google Calendar (next)

- OAuth 2, Calendar API v3, `events.list` with a stored `nextSyncToken`.
- HTTP 410 on the token → full resync.
- Map Google events ↔ `PlanItem` of `kind: "event"` with `externalId`.
- **Do not** push objectives or tasks to Google (Google CalDAV does not expose VTODO anyway).
- Two-way for events only, on calendars the user opted in.
- Private events and Meet data stay Google-shaped; we store what we can round-trip.

### 3. iCloud Calendar (after Google)

- CalDAV at `caldav.icloud.com`, Apple **app-specific password** (not account password, not OAuth).
- No webhooks: poll with `sync-collection`.
- Updates are a full iCalendar PUT (no PATCH).
- ICS subscribe URLs are read-only and often hours late — use them only if the user wants a watch-only calendar (`access: "readonly"`).

### 4. Other CalDAV

Same stack as iCloud (Nextcloud, Fastmail). Capability-detect; degrade to read-only when write fails.

### Conflict rule

Last writer on the **event** body wins on the provider. Planning links (`parentId`, tasks) live only in this app and are never overwritten by a remote event payload. If a remote event is deleted, keep local prep tasks and mark the event cancelled, do not cascade-delete planning.

### What we will not do

- Mirror Google into iCloud or the reverse inside this app.
- Upload the task tree to any provider.
- Silently edit a read-only event.
