import type { CompareData } from "@/types/compare";
import type { ReportConfig } from "@/components/GenerateReportModal";
import { fetchCompareData } from "@/lib/api";

export interface YearPair {
  label: string; // e.g. "2024–2025"
  baselineStart: string; // YYYY-MM-DD
  baselineEnd: string;
  compareStart: string;
  compareEnd: string;
}

export interface Mover {
  neighborhood_id: string;
  neighborhood_name: string;
  delta: number;
  baseline_ratio: number | null;
  compare_ratio: number | null;
}

export interface YearPairResult {
  yearPair: YearPair;
  status: "ok" | "unavailable";
  topPositive: Mover[];
  topNegative: Mover[];
  citywideMedianDelta: number | null;
  errorMessage?: string;
}

export interface ReportObject {
  config: ReportConfig;
  generatedAt: string; // ISO timestamp
  pairs: YearPairResult[];
}

/** Pad month 1–12 to "01"–"12" */
function mm(month: number): string {
  return String(month).padStart(2, "0");
}

/**
 * Build consecutive year-pairs for the same month range.
 * Jan–Sep, 2021–2025 → 4 pairs:
 *   2021 vs 2022, 2022 vs 2023, 2023 vs 2024, 2024 vs 2025
 */
export function buildYearPairs(config: ReportConfig): YearPair[] {
  const { startMonth, endMonth, startYear, endYear } = config;
  const pairs: YearPair[] = [];

  for (let year = startYear; year < endYear; year++) {
    const next = year + 1;
    pairs.push({
      label: `${year}–${next}`,
      baselineStart: `${year}-${mm(startMonth)}-01`,
      baselineEnd: `${year}-${mm(endMonth)}-01`,
      compareStart: `${next}-${mm(startMonth)}-01`,
      compareEnd: `${next}-${mm(endMonth)}-01`,
    });
  }

  return pairs;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Turn one compare response into movers + median for the report object. */
export function summarizeCompareResult(
  yearPair: YearPair,
  data: CompareData[]
): YearPairResult {
  const withDelta: Mover[] = data
    .filter((row): row is CompareData & { delta: number } => row.delta != null)
    .map((row) => ({
      neighborhood_id: row.neighborhood_id,
      neighborhood_name: row.neighborhood_name,
      delta: row.delta,
      baseline_ratio: row.baseline_ratio,
      compare_ratio: row.compare_ratio,
    }));

  const sortedDesc = [...withDelta].sort((a, b) => b.delta - a.delta);
  const topPositive = sortedDesc.filter((m) => m.delta > 0).slice(0, 5);
  const topNegative = [...withDelta]
    .sort((a, b) => a.delta - b.delta)
    .filter((m) => m.delta < 0)
    .slice(0, 5);

  const medianDelta = median(withDelta.map((m) => m.delta));

  return {
    yearPair,
    status: "ok",
    topPositive,
    topNegative,
    citywideMedianDelta:
      medianDelta != null ? Math.round(medianDelta * 10) / 10 : null,
  };
}

export function unavailablePair(
  yearPair: YearPair,
  errorMessage: string
): YearPairResult {
  return {
    yearPair,
    status: "unavailable",
    topPositive: [],
    topNegative: [],
    citywideMedianDelta: null,
    errorMessage,
  };
}

export async function runReport(
  config: ReportConfig,
  onProgress?: (done: number, total: number, label: string) => void
): Promise<ReportObject> {
  const yearPairs = buildYearPairs(config);
  const pairs: YearPairResult[] = [];

  for (let i = 0; i < yearPairs.length; i++) {
    const yearPair = yearPairs[i];
    onProgress?.(i, yearPairs.length, yearPair.label);

    try {
      const data = await fetchCompareData(
        yearPair.baselineStart,
        yearPair.baselineEnd,
        yearPair.compareStart,
        yearPair.compareEnd
      );
      pairs.push(summarizeCompareResult(yearPair, data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "data unavailable";
      pairs.push(unavailablePair(yearPair, message));
    }
  }

  onProgress?.(yearPairs.length, yearPairs.length, "done");

  return {
    config,
    generatedAt: new Date().toISOString(),
    pairs,
  };
}