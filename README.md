# Planner

A local-first planner made of **calendars**: one per area of your life, business
or project ("Olivier's plan", "Goji Berry"…). Each calendar holds items of four
kinds that read as one hierarchy:

- **Events**: dated entries, the classic calendar content.
- **Objectives**: what matters over a period. They sit in a strip above the
  calendar grid and group the roadmap.
- **Tasks**: concrete actions, on their own or contributing to an objective.
- **Subtasks**: tasks nested under a task. They stay folded into their parent
  (which shows a `done/total` count) unless revealed from the Display menu.

Two views of the same calendar, at the same zoom (year, month, week, day):

- **Calendar** (default): what is planned when, with active objectives on top.
- **Roadmap**: every item as a bar on a continuous time axis, grouped by
  objective; drag to move or resize.

Data-wise a calendar is still a `Plan` row and the routes stay under `/plan/`;
only the wording changed.

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
