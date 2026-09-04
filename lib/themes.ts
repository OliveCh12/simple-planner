export const ACCENTS = [
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
  { id: "orange", label: "Orange" },
  { id: "neutral", label: "Neutral" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export const ACCENT_IDS = ACCENTS.map((accent) => accent.id) as [AccentId, ...AccentId[]];

export const DEFAULT_ACCENT: AccentId = "green";
