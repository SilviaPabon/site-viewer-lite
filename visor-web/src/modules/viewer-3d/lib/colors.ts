// One color per level, by its position in project.levels. Used by the boxes and by the level filter swatches.
const PALETTE = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
];

export function levelColor(levels: string[], level: string): string {
  const i = Math.max(0, levels.indexOf(level));
  return PALETTE[i % PALETTE.length]!;
}
