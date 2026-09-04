import { NotConfiguredError, type PlannerRepository } from "@/lib/repository/types";

function fail(): never {
  throw new NotConfiguredError();
}

/** Typed stub. The open-source sync server lands later; every method throws. */
export class RemoteRepository implements PlannerRepository {
  plans = {
    list: async () => fail(),
    get: async () => fail(),
    put: async () => fail(),
    delete: async () => fail(),
  };
  items = {
    listByPlan: async () => fail(),
    query: async () => fail(),
    get: async () => fail(),
    put: async () => fail(),
    putMany: async () => fail(),
    delete: async () => fail(),
  };
  people = {
    list: async () => fail(),
    get: async () => fail(),
    put: async () => fail(),
    delete: async () => fail(),
  };
  categories = {
    list: async () => fail(),
    get: async () => fail(),
    put: async () => fail(),
    delete: async () => fail(),
  };
  settings = {
    get: async () => fail(),
    put: async () => fail(),
  };
  exportAll = async () => fail();
  importAll = async () => fail();
  clear = async () => fail();
  subscribe() {
    return () => undefined;
  }
}
