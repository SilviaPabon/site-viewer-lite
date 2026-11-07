export type AreaUnit = "m2" | "ft2";

const FT2_PER_M2 = 10.7639;

export function formatArea(m2: number, unit: AreaUnit): string {
  return unit === "m2"
    ? `${m2.toFixed(1)} m²`
    : `${(m2 * FT2_PER_M2).toFixed(1)} ft²`;
}

// Kept as the API sends it (YYYY-MM-DD): parsing with Date would shift the day in timezones west of UTC.
export function formatDate(date: string | null): string {
  return date ?? "Not recorded";
}
