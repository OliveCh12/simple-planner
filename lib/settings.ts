import { DEFAULT_ACCENT } from "@/lib/themes";
import type { AppSettings } from "@/types";

/** IndexedDB database name. Kept from v1 so existing data is found and migrated. */
export const DB_NAME = "RoadmapDB";

export function getDefaultSettings(): AppSettings {
  return {
    theme: "auto",
    accent: DEFAULT_ACCENT,
    font: "ubuntu",
    defaultView: "timeline",
    firstDayOfWeek: 1,
    dateFormat: "MMM d, yyyy",
    showWeekNumbers: false,
  };
}
