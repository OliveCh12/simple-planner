# Calendrier zoomable — conception

Refonte du modèle temporel : on abandonne le découpage « roadmap → mois → objectives » pour un conteneur à plage de dates libre, des éléments à début/fin absolus, et une timeline zoomable.

Le **rendu en colonnes** (une liste par unité, tâches répétées) a été remplacé par un **lane board** continu. Voir §7. Le modèle de données de §2 est inchangé.

## 1. Nommage

| Aujourd'hui | Retenu | Pourquoi |
|---|---|---|
| Roadmap | **Plan** | Neutre : couvre « vie perso 2027 », un projet web, un sprint, une journée. Court, aligné sur le nom de l'app (Planner). « Timeline » désigne la *vue*, pas le contenu ; « Board » évoque un kanban ; « Project » est trop étroit. |
| Objective | **Task** | L'élément a un cycle de vie (`pending`, `in-progress`, `completed`, `blocked`) : c'est quelque chose qu'on *fait*. « Item » collisionne avec le composant shadcn `Item` ; « Event » suppose une heure fixe et n'a pas de statut « blocked » ; « Goal » ne colle pas à « dentiste 9h ». |
| Month (colonne) | **TimeColumn** | Une colonne = une unité de l'échelle courante. |
| — | **TimeScale** (`scale`) | `year \| month \| week \| day \| hour`. Dans l'UI : « Zoom ». |

Renommages concrets :

- Types : `Roadmap → Plan`, `Objective → Task`, `ObjectiveStatus → TaskStatus`, `MonthBlock` supprimé.
- Store/hooks : `roadmapStore → planStore`, `useRoadmap → usePlan`, `useObjectiveActions → useTaskActions`.
- Composants : `components/roadmap/* → components/plan/*` (`PlanCard`, `NewPlanCard`, `CreatePlanDialog`, `RemoveDropZone`), `components/objective/* → components/task/*` (`TaskItem`, `AddTaskItem`, `TaskProperties`), `MonthColumn → components/timeline/TimeColumn`.
- Routes : `/roadmap/[roadmapId] → /plan/[planId]`. **Casse les URLs existantes** : on garde `app/roadmap/[roadmapId]/page.tsx` (et `…/objective/[id]`) comme redirections client vers `/plan/[id]`, sur le modèle de la page de redirection existante.
- Textes UI : « Roadmaps » → « Plans », « Add a goal » → « Add a task », « objective » → « task » partout (home, settings/data, dialogs, toasts, README).
- Données d'exemple : `sampleRoadmapData → samplePlan`, titre « Dev career plan », tâches à plat avec offsets relatifs au début du plan.

Ce qui ne change **pas** (sinon perte de données) : le nom IndexedDB `"RoadmapDB"` (la classe devient `PlannerDB` mais `super("RoadmapDB")` reste), la clé zustand `planner-ui-storage`.

## 2. Modèle de données

```ts
// types/index.ts
export type TimeScale = "year" | "month" | "week" | "day" | "hour";
export type TaskStatus = "pending" | "in-progress" | "completed" | "cancelled" | "blocked";
export type EnergyLevel = "low" | "medium" | "high" | "critical";

/** "YYYY-MM-DD" (all-day) ou "YYYY-MM-DDTHH:mm" (heure locale, sans fuseau). */
export type LocalDateTime = string;

export interface Task {
  id: string;
  title: string;
  notes: string;
  start: LocalDateTime;   // all-day : inclusif. Timed : instant de début.
  end: LocalDateTime;     // all-day : inclusif. Timed : instant de fin. Même forme que start.
  status: TaskStatus;
  energy: EnergyLevel;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  start: string;          // "YYYY-MM-DD", inclusif
  end: string;            // "YYYY-MM-DD", inclusif
  tasks: Task[];          // à plat, non ordonné (tri au rendu)
  scale?: TimeScale;      // dernière échelle utilisée ; absent = auto selon la durée
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

export interface AppData {
  version: 2;
  plans: Plan[];
  settings: AppSettings;  // inchangé
  activePlanId?: string;
  lastBackup?: string;
  lastExport?: string;
}
```

Décisions :

- **Dates en chaînes locales, pas en timestamps.** Le code se bat déjà contre le décalage UTC (`createISODate`). Une chaîne `"2027-09-14"` reste un 14 septembre quel que soit le fuseau, l'export JSON est lisible, et le tri lexicographique fonctionne (`"2027-09-14" < "2027-09-14T09:00"` : all-day avant timed).
- **Une seule sémantique interne** : `intervalOf(task)` renvoie un intervalle demi-ouvert `[start, end)` en `Date` locales (all-day : `end` = lendemain 00:00). Tout le layout, l'intersection et le DnD passent par là. Le stockage garde la sémantique humaine (14–16 sept = `end: "2027-09-16"`).
- **`isPinned` supprimé.** Remplacé par une propriété dérivée et relative à l'échelle : une tâche « spanning » dans une colonne est une tâche dont l'intervalle n'est pas contenu dans la colonne. Elle est triée en tête et rendue en barre continue. À l'échelle mois, c'est exactement l'ancien comportement (objectif sur tout le mois = en haut), et ça marche à toutes les échelles.
- **Champs supprimés** : `duration` (dérivé), `description` (fusionné dans `notes` — l'UI écrit déjà les deux à l'identique), `priority`, `progress`, `tags`, `subtasks`, `category`, et côté conteneur `colorTheme`, `icon`, `category`, `MonthBlock.reflection`. Aucun n'est éditable dans l'UI ; `energy` couvre le besoin de pondération, `status` couvre `progress`. Les valeurs présentes dans d'anciens backups sont ignorées à l'import (seules les données d'exemple en ont).
- **Ordre manuel supprimé.** Tri chronologique pur ; l'undo de suppression ré-insère par id, plus besoin d'index.
- `AppSettings` inchangé. `firstDayOfWeek` et `showWeekNumbers` deviennent enfin utiles (colonnes semaine, en-têtes).

### Dexie

```ts
this.version(1).stores({ roadmaps: "id, category, createdAt, lastAccessedAt", appSettings: "id" });
this.version(2)
  .stores({ plans: "id, createdAt, lastAccessedAt" })
  .upgrade(async (tx) => {
    const roadmaps = await tx.table("roadmaps").toArray();
    await tx.table("plans").bulkAdd(roadmaps.map(migrateRoadmapToPlan));
  });
this.version(3).stores({ roadmaps: null });
```

Deux versions car Dexie ne permet pas de lire une table supprimée dans la même version. `migrateRoadmapToPlan` est une fonction pure dans `lib/migrations.ts`, partagée par l'upgrade Dexie et l'import.

Règles de migration (sans perte) :

- `plan.start = min(startYear-01-01, min(task.start))`, `plan.end = max(endYear-12-31, max(task.end))` — les données d'exemple ont des objectifs qui dépassent les années du roadmap.
- Chaque objective de chaque mois devient une `Task` avec ses `startDate`/`endDate` tels quels (déjà en `YYYY-MM-DD`). Un objectif « janvier » qui va jusqu'au 28 février s'étend désormais naturellement sur deux colonnes.
- Dates invalides → bornes du mois d'origine. Id dupliqué entre mois → nouvel id.
- `notes = notes ?? description ?? ""`, `energy = energyLevel`.

### Import / export

- Export écrit `version: 2`.
- `parseAppData` accepte `z.discriminatedUnion("version", [v1, v2])` et renvoie toujours un `AppData` v2 (v1 passe par `migrateRoadmapToPlan`). Les anciens backups restent importables.
- Tests : `lib/migrations.test.ts` (fixture v1 réaliste incluant multi-mois, dates invalides, doublons), `lib/db.test.ts` (ouvre `"RoadmapDB"` en v1 via Dexie brut, insère, ferme, ouvre `PlannerDB`, vérifie `plans`), `lib/validation.test.ts` (import v1 et v2).

## 3. Zoom

### Échelles

| Scale | Colonne | Largeur | En-tête (eyebrow / titre) |
|---|---|---|---|
| `year` | 1 année | 320 px | — / `2027` |
| `month` | 1 mois | 300 px | `2027` / `September` |
| `week` | 1 semaine (`firstDayOfWeek`) | 280 px | `W37` / `13 – 19 Sep` |
| `day` | 1 jour | 240 px | `Sep 2027` / `Mon 14` |
| `hour` | 1 heure | 160 px | `Mon 14 Sep` / `09:00` |

Les colonnes couvrent des unités entières : un plan « 1 jan → 31 déc 2027 » à l'échelle semaine commence à la semaine contenant le 1er janvier. Largeur uniforme par échelle : c'est ce qui rend le reste trivial (index = `scrollLeft / width`).

### Passage d'une échelle à l'autre

- Échelle linéaire `year ↔ month ↔ week ↔ day ↔ hour`, toutes disponibles pour tout plan.
- Déclencheurs : contrôle segmenté `ToggleGroup` (Y M W D H) dans le `SubHeader`, touches `+` / `-`, `Ctrl/Cmd + molette` (c'est aussi ce que le navigateur envoie pour le pinch trackpad), throttlé à 150 ms. Pinch tactile mobile hors périmètre : le contrôle segmenté suffit.
- **Ancrage** : avant le changement, on prend l'instant sous le curseur (molette) ou au centre du viewport (clavier, contrôle) via `instantAtX(x)` ; après le rendu, `useLayoutEffect` fait `scrollLeft = xOfInstant(instant) - offset`. `xOfInstant` = index de colonne + fraction de temps écoulée dans la colonne, fois la largeur. Pas de saut visible.
- **Échelle par défaut** (durée du plan) : ≤ 2 jours → `hour` ; ≤ 6 semaines → `day` ; ≤ 6 mois → `week` ; ≤ 3 ans → `month` ; au-delà → `year`. Un plan « octobre » s'ouvre par jour, un sprint par jour, une année par mois. L'échelle choisie est persistée dans `plan.scale`.
- **Today** : scrolle et sélectionne la colonne contenant maintenant à l'échelle courante ; hors plage, la première colonne. La colonne courante garde le badge « Now » et la bordure `primary`. `←` / `→` décalent d'une colonne. Raccourci `T` pour Today.

### Rendu d'une tâche multi-unités

On garde l'identité de l'app : chaque colonne est une liste verticale de lignes compactes éditables inline. Une tâche est rendue **dans chaque colonne qu'elle intersecte**. Dans une colonne, elle est soit *contained* (l'intervalle tient dans la colonne), soit *spanning* :

- Les spanning sont triées en tête, dans un ordre indépendant de la colonne (`start` asc, `end` desc, `id`) : elles s'alignent donc d'une colonne à l'autre et lisent comme une barre continue. Le bord gauche est plat si la tâche a commencé avant la colonne, le bord droit plat si elle continue après, avec une fine bande `primary` sur toute la largeur. Le titre est répété dans chaque colonne (les colonnes sont larges et loin les unes des autres ; c'est ce que fait un calendrier semaine).
- Les contained suivent, triées par `start` puis `createdAt`, avec le libellé de plage adapté à l'échelle : mois → `14–16`, semaine → `Mon–Wed`, année → `Sep 14–16`, jour/heure → `09:30–11:00` (rien si all-day).
- **Échelle année** : la colonne regroupe ses tâches sous des sous-en-têtes de mois (sticky dans le scroll de la colonne). C'est le « regroupement quand on dézoome ».
- **Échelle heure, tâches sans heure** : elles ne vont pas dans les 24 colonnes de leur journée. Une **bande all-day** sticky au-dessus des colonnes, avec une cellule par jour (largeur = 24 colonnes), liste les tâches all-day de ce jour sous forme de lignes compactes (même `TaskItem`, expansion inline identique). C'est le pattern « all-day » des calendriers. Créer une tâche dans une cellule de la bande donne une tâche all-day ; dans une colonne heure, une tâche de `HH:00` à `HH+1:00`.

Éditer une tâche depuis n'importe laquelle de ses colonnes édite la même tâche (même id, même `TaskItem`).

### Drag-and-drop

Règle unique : **déplacer = translater d'un nombre entier de colonnes, en conservant la durée.** `delta = index(cible) − index(source)`, puis `shiftTask(task, scale, delta)` avec `add()` de date-fns (le 31 janvier + 1 mois donne le 28 février ; l'heure et le jour de semaine sont conservés aux échelles fines). Prévisible à toutes les échelles, et le même geste marche pour une tâche contained et pour une tâche spanning attrapée par n'importe laquelle de ses colonnes. La zone « Drop to delete » est inchangée.

### Édition de dates

`DaysChip` devient `DateRangeChip` : popover avec deux `<input type="date">` natifs dans des `InputGroup`, un bouton « Add time » qui révèle deux `<input type="time">`, un bouton « Remove time ». Pas de lib calendrier : les inputs natifs sont bons sur desktop et mobile, et cohérents avec la contrainte. `CreatePlanDialog` remplace les deux années par deux dates natives, avec une description calculée (« 31 days », « 12 months ») via `intervalToDuration`.

## 4. Architecture

```
lib/time/
  scale.ts       SCALES, COLUMN_WIDTH, TimeColumn, columnsFor(scale, plan), indexOfInstant,
                 xOfInstant, instantAtX, defaultScaleFor(plan), zoomIn/zoomOut
  local.ts       parseLocal, formatLocal, isAllDay, intervalOf(task), intersects, contains,
                 shiftTask(task, scale, delta), todayColumnIndex
  labels.ts      columnLabel(column, scale, settings), taskRangeLabel(task, column, scale)
lib/plan.ts      createPlan, createTask, tasksInColumn(tasks, column) → { spanning, contained },
                 groupByMonth (échelle année)
lib/migrations.ts   migrateRoadmapToPlan, migrateAppData
lib/validation.ts   schémas v1 + v2, parseAppData
lib/db.ts        PlannerDB (versions 1→2→3), getAllPlans, savePlan, …

store/planStore.ts  currentPlan, addTask, updateTask, deleteTask, setScale (plus de monthKey)
hooks/usePlan.ts, useTaskActions.ts
hooks/useTimelinePan.ts      conservé, sélecteur ".month-scroll" → "[data-column-scroll]"
hooks/useTimelineZoom.ts     +/-, Ctrl+molette, ancrage
hooks/useVirtualColumns.ts   fenêtre [from, to] à partir de scrollLeft / width, spacers gauche/droite

components/timeline/
  TimelineBoard.tsx   colonnes virtualisées, DragDropProvider, pan, zoom, Today (extrait de la page)
  TimeColumn.tsx      remplace MonthColumn : en-tête générique, sections spanning / contained,
                      sous-en-têtes de mois à l'échelle année, AddTaskItem
  AllDayBand.tsx      échelle heure uniquement
  ScaleControl.tsx    ToggleGroup Y M W D H + Tooltip avec Kbd
components/task/     TaskItem, AddTaskItem, TaskProperties (StatusChip, EnergyChip, DateRangeChip)
components/plan/     PlanCard, NewPlanCard, CreatePlanDialog, RemoveDropZone
app/plan/[planId]/page.tsx    usePlan + SubHeader + <TimelineBoard />
```

- `generateMonthKeys` → `columnsFor`. `sortObjectives` → `tasksInColumn`. `getCenteredMonthKey` → `indexOfInstant(instantAtX(center))`.
- **Virtualisation maison** : largeur uniforme, donc `from = floor(scrollLeft / w) - buffer`, `to = ceil((scrollLeft + clientWidth) / w) + buffer`, deux spacers pour le reste. Une trentaine de lignes, pas de dépendance. Nécessaire dès l'échelle heure (un plan d'un an = 8 760 colonnes).
- Droppable id = `column.key`, draggable data = `{ taskId, planId, sourceKey }`. Le store ne fait que `updateTask(id, { start, end })`.
- UI shadcn réutilisée telle quelle : `ToggleGroup`, `ButtonGroup`, `InputGroup`, `Popover`, `Tooltip`, `Kbd`, `Badge`, `Empty`, `Field`, `Dialog`, Sonner. Rien à ajouter.

## 5. Réponses aux questions ouvertes

1. **Épinglé** : plus de flag stocké. « Spanning » dérivé par colonne et par échelle, trié en tête. Même rendu qu'aujourd'hui à l'échelle mois, généralisé.
2. **Tâche sans heure à l'échelle heure** : bande all-day sticky par jour au-dessus des colonnes heure.
3. **`energyLevel`** gardé (renommé `energy`, déjà exposé). `priority`, `progress`, `tags`, `subtasks` supprimés : jamais exposés, `status` et `energy` suffisent. Réintroduire plus tard coûte une version Dexie, pas plus.
4. **Échelle par défaut** : par durée du plan (voir tableau), puis persistée par plan.

## 6. Étapes livrables

Branche `feat/zoomable-timeline`. Chaque étape : `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verts, un ou deux commits, vérification navigateur (desktop/mobile, light/dark) aux étapes 2, 4, 5, 6.

1. **Fondations lib, app intacte.** Types `Plan`/`Task`/`TimeScale` ajoutés à côté des anciens, `lib/time/*`, `lib/migrations.ts`, schémas zod v1/v2, tests migration + dates + échelle. Pas de bump Dexie.
2. **Bascule du modèle, échelle mois fixe.** Dexie v2/v3, `planStore`, `usePlan`, `TimelineBoard` + `TimeColumn` + `TaskItem` + `DateRangeChip` (dates natives), `CreatePlanDialog` avec dates, DnD par translation de colonnes, undo par id. Anciens composants supprimés. Visuellement quasi identique, sauf que les tâches multi-mois apparaissent dans chaque mois.
3. **Renommage.** Routes `/plan/[planId]` + redirections, home, cards, settings, textes, données d'exemple, README, métadonnées.
4. **Zoom.** `ScaleControl`, `useTimelineZoom`, ancrage, largeurs et en-têtes par échelle, échelle par défaut, regroupement par mois à l'échelle année, Today par échelle, persistance `plan.scale`, tests de `scale.ts`.
5. **Échelle heure.** `useVirtualColumns`, `AllDayBand`, heures dans `DateRangeChip`, libellés horaires.
6. **Finition.** Page Shortcuts à jour (`+`, `-`, `T`, `Ctrl+molette`), `firstDayOfWeek` et `showWeekNumbers` honorés, passe mobile, README.

## 7. Lane board (remplace le rendu en colonnes)

Le modèle `Plan`/`Task` est inchangé. Le rendu « une colonne par unité, tâche listée dans chaque colonne intersectée » ne passait pas à l'échelle (une tâche de 3 jours apparaissait 3 fois, 72 fois à l'heure). Il est remplacé par un axe continu et une barre par tâche.

### Mapping temps → pixels

`lib/time/layout.ts` : `x(t) = (t − origin) × pxPerMs`. `origin` = début de la première unité couvrant le plan. `pxPerMs = PX_PER_UNIT[scale] / NOMINAL_MS[scale]`. Les unités ont leur **durée réelle** (février plus étroit que mars ; jour DST 23/24 ou 25/24). Plus de largeur uniforme ni de gap. `columnsFor` ne sert plus qu'à générer les ticks d'en-tête et de grille.

Plafond `MAX_SCROLL_WIDTH = 8_000_000` : au-delà, `pxPerMs` est réduit (plan multi-années à l'heure).

En-tête à deux niveaux : année au-dessus des mois, mois au-dessus des semaines/jours, jour au-dessus des heures. Ancrage au zoom via `xOf` / `instantAt` (proportionnel au temps, pas à l'index).

### Lanes

`lib/lanes.ts` : deux piles indépendantes (all-day / timed). Tri `start` asc, durée desc, `id`. Pastilles (`width < 24 px`) pré-clusterisées sur l'axe, puis packing glouton avec overflow de libellé (`occupiedUntil = max(barre, label) + 4`). Jalon = timed de durée ≤ 1 min, pastille 10 px.

### Composants

```
lib/time/layout.ts     TimeLayout, xOf, instantAt, PX_PER_UNIT
lib/time/snap.ts       snap 15 min à l'heure, shiftBySnap, resizeTask
lib/lanes.ts           layoutLanes
hooks/useVisibleRange.ts   fenêtre [fromX, toX] + visibleFrom (libellés)
hooks/useTaskPointer.ts    move / resize / rubber-band create / delete

components/timeline/
  TimelineBoard.tsx    pan, zoom ancré, clavier, SubHeader + Add a task
  TimelineHeader.tsx   ticks major/minor, badge Now
  TimelineGrid.tsx     lignes verticales
  NowLine.tsx          ligne primary
  LaneLayer.tsx        all-day (bande haute) + timed (flex-1 à day/hour)
  TaskBar.tsx          une barre, popover éditeur, poignées de resize
  ClusterBar.tsx       « N tasks » → liste → éditeur
  RemoveDropZone.tsx   hit-test, plus de dnd-kit
components/task/TaskEditor.tsx
```

Supprimé : `TimeColumn`, `AllDayBand`, `TimelineViewport`, `TaskItem`, `useVirtualColumns`, `tasksInColumn`, `groupTasksByMonth`, `@dnd-kit/react`.

### Interactions

- Clic → `TaskPopover` (titre, notes, Status / Energy / Dates, delete+undo).
- Drag du corps → `shiftBySnap` (unité de l'échelle ; 15 min à l'heure ; all-day à l'heure → jour).
- Drag des bords → `resizeTask` avec le même snap.
- Drag sur une lane vide → création sur la plage balayée.
- « Add a task » dans le SubHeader → unité au centre du viewport.
- Pan Espace+drag, `←` `→`, `T`, `+` `-`, Ctrl/⌘+molette avec ancrage : inchangés.

### Étapes (branche `feat/lane-timeline`)

1. `lib/time/layout.ts` + tests (DST, plafond).
2. `lib/lanes.ts` + tests.
3. Bascule visuelle (plus de colonnes).
4. Pointer drag / resize / create ; retrait de dnd-kit.
5. Shortcuts, README, ce document.
