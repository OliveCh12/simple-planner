export const RECURRENCE_PRESETS = [
  { id: "none", label: "Does not repeat", rrule: undefined },
  { id: "daily", label: "Daily", rrule: "FREQ=DAILY" },
  { id: "weekdays", label: "Every weekday", rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
  { id: "weekly", label: "Weekly", rrule: "FREQ=WEEKLY" },
  { id: "monthly", label: "Monthly", rrule: "FREQ=MONTHLY" },
  { id: "custom", label: "Custom", rrule: undefined },
] as const;

export type RecurrencePresetId = (typeof RECURRENCE_PRESETS)[number]["id"];

export function recurrencePresetId(rrule?: string): RecurrencePresetId {
  if (!rrule) return "none";
  const match = RECURRENCE_PRESETS.find((preset) => preset.id !== "none" && preset.id !== "custom" && preset.rrule === rrule);
  return match?.id ?? "custom";
}
