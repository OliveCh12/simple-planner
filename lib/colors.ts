export const SWATCH_COLORS = [
  { hex: "#16a34a", label: "Green" },
  { hex: "#2563eb", label: "Blue" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#e11d48", label: "Rose" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#737373", label: "Neutral" },
] as const;

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
