import type { CompareData } from "@/types/compare";
import type { LensData } from "@/types/lens";

export function metricFor(
  compareMode: boolean,
  activeLens: 1 | 2 | 3,
  lens1Mode: "raw" | "per_capita",
  row: LensData | CompareData
): number | null {
  if (compareMode) return (row as CompareData).delta ?? null;
  if (activeLens === 1) {
    return lens1Mode === "raw"
      ? ((row as LensData).raw_count ?? null)
      : ((row as LensData).per_capita ?? null);
  }
  return (row as LensData).value ?? null;
}

export function isProvisionalDate(endDate: string, nowMs = Date.now()): boolean {
  const ageDays = (nowMs - new Date(endDate).getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays < 90;
}
