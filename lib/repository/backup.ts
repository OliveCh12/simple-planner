import { parseAppData } from "@/lib/validation";
import { getRepository } from "@/lib/repository/create";
import type { AppData, AppSettings } from "@/types";

export async function exportJson(settings: AppSettings): Promise<string> {
  const data = await getRepository().exportAll();
  const payload: AppData = {
    ...data,
    settings,
    lastExport: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export async function importJson(jsonString: string): Promise<AppSettings> {
  const data = parseAppData(jsonString);
  await getRepository().importAll(data);
  return data.settings;
}

export async function downloadBackup(settings: AppSettings): Promise<void> {
  const json = await exportJson(settings);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `timeline-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
