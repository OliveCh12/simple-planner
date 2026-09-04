export const FONT_OPTIONS = [
  {
    id: "ubuntu",
    label: "Ubuntu",
    cssVar: "--font-ubuntu",
    preview: "Clear and friendly",
  },
  {
    id: "inter",
    label: "Inter",
    cssVar: "--font-inter",
    preview: "Neutral UI sans",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    cssVar: "--font-dm-sans",
    preview: "Geometric and open",
  },
  {
    id: "outfit",
    label: "Outfit",
    cssVar: "--font-outfit",
    preview: "Modern geometric",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    cssVar: "--font-ibm-plex-sans",
    preview: "Technical and precise",
  },
  {
    id: "source-serif-4",
    label: "Source Serif 4",
    cssVar: "--font-source-serif",
    preview: "Readable serif",
  },
  {
    id: "literata",
    label: "Literata",
    cssVar: "--font-literata",
    preview: "Editorial serif",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    cssVar: "--font-fraunces",
    preview: "Soft display serif",
  },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

export const FONT_IDS = FONT_OPTIONS.map((font) => font.id) as [FontId, ...FontId[]];

export const DEFAULT_FONT_ID: FontId = "ubuntu";

export function getFontOption(id: string | undefined) {
  return FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];
}
