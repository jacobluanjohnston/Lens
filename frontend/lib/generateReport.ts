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

export interface FocusWindow {
  label: string;
  eventLabel?: string;
  baselineStart: string;
  baselineEnd: string;
  compareStart: string;
  compareEnd: string;
}

export interface AnomalyAssessment {
  isAnomaly: boolean;
  headline: string;
  detail: string;
  focusTopMover: Mover | null;
  focusCityMedian: number | null;
  historicalMaxTopDelta: number | null;
  historicalMedianOfMedians: number | null;
}

export interface ReportObjectWithFocus extends ReportObject {
  focus: YearPairResult | null;
  focusEventLabel?: string;
  anomaly: AnomalyAssessment;
}

function topMoverDelta(pair: YearPairResult): number | null {
  if (pair.status !== "ok" || pair.topPositive.length === 0) return null;
  return pair.topPositive[0].delta;
}

function formatDeltaShort(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

/** Compare focus window to earlier YoY pairs — excludes the latest pair (often the outlier year). */
export function assessAnomaly(
  focus: YearPairResult | null,
  historical: YearPairResult[]
): AnomalyAssessment {
  // Baseline = all modal year-pairs except the most recent (e.g. 2021-2024, not 2024-2025)
  const baselineHistorical =
    historical.length > 1 ? historical.slice(0, -1) : historical;

  const okBaseline = baselineHistorical.filter((p) => p.status === "ok");
  const baselineTopDeltas = okBaseline
    .map(topMoverDelta)
    .filter((d): d is number => d != null);
  const baselineMedians = okBaseline
    .map((p) => p.citywideMedianDelta)
    .filter((d): d is number => d != null);

  const focusTop = focus?.status === "ok" ? focus.topPositive[0] ?? null : null;
  const focusTopDelta = focusTop?.delta ?? null;
  const focusMedian = focus?.citywideMedianDelta ?? null;

  const historicalMinTop =
    baselineTopDeltas.length > 0 ? Math.min(...baselineTopDeltas) : null;
  const historicalMaxTop =
    baselineTopDeltas.length > 0 ? Math.max(...baselineTopDeltas) : null;
  const historicalMedianOfMedians =
    baselineMedians.length > 0
      ? Math.round(
          (baselineMedians.reduce((a, b) => a + b, 0) / baselineMedians.length) *
            10
        ) / 10
      : null;

  const baselineRangeLabel =
    okBaseline.length > 0
      ? `${okBaseline[0].yearPair.label.replace(/[–—]/g, "-").split("-")[0]}-${okBaseline[okBaseline.length - 1].yearPair.label.replace(/[–—]/g, "-").split("-")[1]}`
      : "prior years";

  if (!focus || focus.status !== "ok") {
    return {
      isAnomaly: false,
      headline: "Could not assess this window.",
      detail:
        focus?.status === "unavailable"
          ? "Selected window data unavailable."
          : "No focus comparison was run.",
      focusTopMover: null,
      focusCityMedian: null,
      historicalMaxTopDelta: historicalMaxTop,
      historicalMedianOfMedians,
    };
  }

  const name = focusTop?.neighborhood_name ?? "The top neighborhood";
  const focusDelta = focusTopDelta ?? 0;

  const rangeText =
    historicalMinTop != null && historicalMaxTop != null
      ? `${formatDeltaShort(historicalMinTop)} to ${formatDeltaShort(historicalMaxTop)}`
      : "unavailable";

  const isAnomaly =
    historicalMaxTop != null && focusDelta > historicalMaxTop + 15;

  if (isAnomaly && historicalMaxTop != null) {
    return {
      isAnomaly: true,
      headline: "This window looks abnormal compared to prior years.",
      detail: `Compared to ${baselineRangeLabel}, typical top-neighborhood increases were about ${rangeText}. ${name} changed ${formatDeltaShort(focusDelta)} in the selected window. This is an anomaly.`,
      focusTopMover: focusTop,
      focusCityMedian: focusMedian,
      historicalMaxTopDelta: historicalMaxTop,
      historicalMedianOfMedians,
    };
  }

  return {
    isAnomaly: false,
    headline: "This window is in line with prior years.",
    detail: `Compared to ${baselineRangeLabel}, typical top-neighborhood increases were about ${rangeText}. ${name} changed ${formatDeltaShort(focusDelta)} in the selected window - similar to that range.`,
    focusTopMover: focusTop,
    focusCityMedian: focusMedian,
    historicalMaxTopDelta: historicalMaxTop,
    historicalMedianOfMedians,
  };
}

export async function runReportWithFocus(
  config: ReportConfig,
  focusWindow: FocusWindow,
  onProgress?: (done: number, total: number, label: string) => void
): Promise<ReportObjectWithFocus> {
  const report = await runReport(config, onProgress);

  let focus: YearPairResult | null = null;
  try {
    const data = await fetchCompareData(
      focusWindow.baselineStart,
      focusWindow.baselineEnd,
      focusWindow.compareStart,
      focusWindow.compareEnd
    );
    focus = summarizeCompareResult(
      {
        label: focusWindow.label,
        baselineStart: focusWindow.baselineStart,
        baselineEnd: focusWindow.baselineEnd,
        compareStart: focusWindow.compareStart,
        compareEnd: focusWindow.compareEnd,
      },
      data
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "data unavailable";
    focus = unavailablePair(
      {
        label: focusWindow.label,
        baselineStart: focusWindow.baselineStart,
        baselineEnd: focusWindow.baselineEnd,
        compareStart: focusWindow.compareStart,
        compareEnd: focusWindow.compareEnd,
      },
      message
    );
  }

  const anomaly = assessAnomaly(focus, report.pairs);

  return { ...report, focus, focusEventLabel: focusWindow.eventLabel, anomaly };
}