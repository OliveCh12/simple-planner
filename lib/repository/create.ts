import { IndexedDbRepository } from "@/lib/repository/indexeddb";
import type { PlannerRepository } from "@/lib/repository/types";

let instance: PlannerRepository | undefined;

export function getRepository(): PlannerRepository {
  if (!instance) instance = new IndexedDbRepository();
  return instance;
}

export function setRepository(repo: PlannerRepository | undefined) {
  instance = repo;
}
