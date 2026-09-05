export const SWATCH_COLORS = [
  { hex: "#16a34a", label: "Green" },
  { hex: "#2563eb", label: "Blue" },
  { hex: "#0d9488", label: "Teal" },
  { hex: "#0284c7", label: "Sky" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#c026d3", label: "Fuchsia" },
  { hex: "#e11d48", label: "Rose" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#d97706", label: "Amber" },
  { hex: "#737373", label: "Neutral" },
] as const;

export type SurfaceTone = "event" | "task" | "objective" | "subtask";

const SURFACE_MIX: Record<SurfaceTone, { top: number; bottom: number }> = {
  event: { top: 48, bottom: 26 },
  task: { top: 34, bottom: 16 },
  objective: { top: 24, bottom: 12 },
  subtask: { top: 18, bottom: 10 },
};

/** Category fill that follows `--background`, so light and dark stay readable. */
export function categorySurface(
  hex: string,
  tone: SurfaceTone
): { backgroundImage: string; borderColor: string } {
  const color = normalizeHex(hex);
  const mix = SURFACE_MIX[tone];
  return {
    borderColor: color,
    backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${color} ${mix.top}%, var(--background)) 0%, color-mix(in oklab, ${color} ${mix.bottom}%, var(--background)) 100%)`,
  };
}

export function surfaceTone(
  kind: "task" | "event" | "objective",
  subtask = false
): SurfaceTone {
  if (subtask) return "subtask";
  return kind;
}

export const DEFAULT_SWATCH = SWATCH_COLORS[0].hex;

export function colorAlpha(hex: string, alpha: number): string {
  const value = normalizeHex(hex);
  const r = Number.parseInt(value.slice(1, 3), 16);
  const g = Number.parseInt(value.slice(3, 5), 16);
  const b = Number.parseInt(value.slice(5, 7), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function normalizeHex(color: string): string {
  const value = color.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(value);
  if (short) {
    const [, digits] = short;
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`.toLowerCase();
  }
  return value.toLowerCase();
}
