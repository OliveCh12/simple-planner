import type { AppData, AppSettings, Category, ItemKind, ItemStatus, LocalDateTime, Person, Plan, PlanItem, Executor } from "@/types";

export type RepositoryCollection = "plans" | "items" | "people" | "categories" | "settings";

export interface RepositoryChange {
  collection: RepositoryCollection;
  op: "put" | "delete" | "import" | "clear";
  ids?: string[];
}

export interface ItemFilter {
  planId?: string;
  kind?: ItemKind | ItemKind[];
  executor?: Executor | Executor[];
  status?: ItemStatus | ItemStatus[];
  parentId?: string | null;
  categoryId?: string;
  assigneeId?: string;
  attendeeId?: string;
  from?: LocalDateTime;
  to?: LocalDateTime;
  query?: string;
}

export interface CrudCollection<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  put(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface PlannerRepository {
  plans: {
    list(): Promise<Plan[]>;
    get(id: string): Promise<Plan | undefined>;
    put(plan: Plan): Promise<void>;
    delete(id: string): Promise<void>;
  };
  items: {
    listByPlan(planId: string): Promise<PlanItem[]>;
    query(filter: ItemFilter): Promise<PlanItem[]>;
    get(id: string): Promise<PlanItem | undefined>;
    put(item: PlanItem): Promise<void>;
    putMany(items: PlanItem[]): Promise<void>;
    delete(id: string): Promise<void>;
  };
  people: CrudCollection<Person>;
  categories: CrudCollection<Category>;
  settings: { get(): Promise<AppSettings | undefined>; put(settings: AppSettings): Promise<void> };
  exportAll(): Promise<AppData>;
  importAll(data: AppData): Promise<void>;
  clear(): Promise<void>;
  /** Fires after any write, with the touched collection, so views can refresh. */
  subscribe(listener: (change: RepositoryChange) => void): () => void;
}

export class NotConfiguredError extends Error {
  constructor(message = "Remote sync is not configured") {
    super(message);
    this.name = "NotConfiguredError";
  }
}
