import type { ItemKind } from "@/types";
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

/** Share of the category color mixed into the background for each tone. */
const SURFACE_MIX: Record<SurfaceTone, number> = {
  event: 15,
  task: 11,
  objective: 9,
  subtask: 7,
};

export interface CategorySurface {
  /** Raw category color, for dots, bars and icons. */
  color: string;
  /** Text color on the tinted surface: the category pulled toward the foreground. */
  ink: string;
  /** Flat tint that follows `--background`, so light and dark stay readable. */
  background: string;
  /** Same tint with a whisper of depth, top slightly denser than bottom. */
  backgroundImage: string;
}

export function categorySurface(hex: string, tone: SurfaceTone): CategorySurface {
  const color = normalizeHex(hex);
  const mix = SURFACE_MIX[tone];
  const top = `color-mix(in oklab, ${color} ${mix + 2}%, var(--background))`;
  const bottom = `color-mix(in oklab, ${color} ${Math.max(4, mix - 2)}%, var(--background))`;
  return {
    color,
    ink: `color-mix(in oklab, ${color} 58%, var(--foreground))`,
    background: `color-mix(in oklab, ${color} ${mix}%, var(--background))`,
    backgroundImage: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
  };
}

/**
 * Header atmosphere for the details pane: two soft radial glows that fade
 * into the surface, so the category reads as a mood and never as a banner.
 */
export function categoryAtmosphere(hex: string): { backgroundImage: string } {
  const color = normalizeHex(hex);
  return {
    backgroundImage: [
      `radial-gradient(110% 95% at 0% 0%, color-mix(in oklab, ${color} 15%, transparent) 0%, transparent 62%)`,
      `radial-gradient(70% 80% at 100% 100%, color-mix(in oklab, ${color} 8%, transparent) 0%, transparent 65%)`,
    ].join(", "),
  };
}

export function surfaceTone(kind: ItemKind, subtask = false): SurfaceTone {
  if (subtask) return "subtask";
  return kind === "project" ? "objective" : kind;
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
