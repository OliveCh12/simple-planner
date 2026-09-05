import type { Plan, PlanItem } from "@/types";

export function isPlanWritable(plan?: Pick<Plan, "source"> | null): boolean {
  return plan?.source?.access !== "readonly";
}

/** External events follow the calendar's access. Goals and tasks stay editable here. */
export function isItemReadOnly(item: PlanItem, plan?: Pick<Plan, "source"> | null): boolean {
  if (item.kind !== "event") return false;
  return !isPlanWritable(plan);
}

export function sourceLabel(plan?: Pick<Plan, "source" | "title"> | null): string {
  const provider = plan?.source?.provider ?? "local";
  if (provider === "local") return plan?.title ? `${plan.title} · local` : "Local calendar";
  const account = plan?.source?.account;
  if (account) return account;
  return provider;
}
