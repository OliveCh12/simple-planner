# Timeline Planner

A local-first, zoomable timeline to plan anything that lives in time: a year of
personal goals, a web project, a two-week sprint, a single event day.

- **Plans** have a free start and end date.
- **Tasks** have an absolute start and end (a date, optionally with a time), so
  they can span months or last an hour.
- The board is a continuous Gantt-style timeline. Zoom steps through years,
  months, weeks, days, or hours; each task is a single bar; drag to move or
  resize.

Everything is stored in the browser (IndexedDB) and can be exported or imported
as JSON. No account, no server.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand,
Dexie, date-fns, Vitest.

## Development

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Data model

See [docs/zoomable-timeline.md](docs/zoomable-timeline.md) for the design of
the time model, the scales, and the migration from the previous month-based
roadmaps. Backups written by older versions (`version: 1`) are still importable.
