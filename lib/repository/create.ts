import { IndexedDbRepository } from "@/lib/repository/indexeddb";
import { RemoteRepository } from "@/lib/repository/remote";
import { readStorageConfig } from "@/lib/storage-config";
import type { PlannerRepository } from "@/lib/repository/types";

let instance: PlannerRepository | undefined;

function createRepository(): PlannerRepository {
  if (typeof window !== "undefined" && readStorageConfig().kind === "remote") {
    return new RemoteRepository();
  }
  return new IndexedDbRepository();
}

export function getRepository(): PlannerRepository {
  if (!instance) instance = createRepository();
  return instance;
}

export function setRepository(repo: PlannerRepository | undefined) {
  instance = repo;
}
