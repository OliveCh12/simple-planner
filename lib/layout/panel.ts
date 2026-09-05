export const PANEL_WIDTH = {
  min: 260,
  max: 560,
  left: 288,
  right: 380,
} as const;

/** Keep a panel usable without starving the calendar. */
export function clampPanelWidth(width: number, available?: number): number {
  const share = available === undefined ? PANEL_WIDTH.max : Math.floor(available * 0.45);
  const cap = Math.max(PANEL_WIDTH.min, Math.min(PANEL_WIDTH.max, share));
  return Math.min(cap, Math.max(PANEL_WIDTH.min, Math.round(width)));
}
