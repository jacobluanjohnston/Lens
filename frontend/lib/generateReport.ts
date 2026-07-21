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
  allMovers: Mover[];
  citywideMedianDelta: number | null;
  errorMessage?: string;
}

export interface ReportObject {
  config: ReportConfig;
  generatedAt: string; // ISO timestamp
  pairs: YearPairResult[];
  rightCensored: boolean;
}

// Last year with a complete data ingest. Update when new annual data is loaded.
export const MAX_REPORT_YEAR = 2026;

/**
 * Standard month range for year-over-year comparison: Jan–Sep.
 * Sep is chosen as the cutoff to avoid the most recent months where
 * reporting lag (right-censoring) is most severe.
 */
const STD_START = "01";
const STD_END = "09";

/**
 * Build consecutive year-pairs using the given month range.
 * Defaults to Jan–Sep when called without months (standalone runReport).
 */
export function buildYearPairs(
  config: ReportConfig,
  startMonth: string = STD_START,
  endMonth: string = STD_END
): YearPair[] {
  const { startYear, endYear } = config;
  const pairs: YearPair[] = [];

  for (let year = startYear; year < endYear; year++) {
    const next = year + 1;
    pairs.push({
      label: `${year}–${next}`,
      baselineStart: `${year}-${startMonth}-01`,
      baselineEnd: `${year}-${endMonth}-01`,
      compareStart: `${next}-${startMonth}-01`,
      compareEnd: `${next}-${endMonth}-01`,
    });
  }

  return pairs;
}

/** Build year-pairs mirroring the focus window's month structure for every year in range. */
function buildYearPairsFromFocus(
  focusWindow: FocusWindow,
  startYear: number,
  endYear: number
): YearPair[] {
  const bStartM = focusWindow.baselineStart.slice(5, 7);
  const bEndM = focusWindow.baselineEnd.slice(5, 7);
  const cStartM = focusWindow.compareStart.slice(5, 7);
  const cEndM = focusWindow.compareEnd.slice(5, 7);
  const yearOffset =
    parseInt(focusWindow.compareStart.slice(0, 4)) -
    parseInt(focusWindow.baselineStart.slice(0, 4));

  const pairs: YearPair[] = [];
  for (let year = startYear; year < endYear; year++) {
    const next = year + yearOffset;
    pairs.push({
      label: `${year}–${next}`,
      baselineStart: `${year}-${bStartM}-01`,
      baselineEnd: `${year}-${bEndM}-01`,
      compareStart: `${next}-${cStartM}-01`,
      compareEnd: `${next}-${cEndM}-01`,
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
    allMovers: sortedDesc,
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
    allMovers: [],
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
    rightCensored: config.endYear >= MAX_REPORT_YEAR,
  };
}

export interface FocusWindow {
  label: string;
  eventLabel?: string;
  baselineStart: string;
  baselineEnd: string;
  compareStart: string;
  compareEnd: string;
  neighborhoodId?: string; // selected neighborhood to track; falls back to topPositive[0]
}

export interface AnomalyAssessment {
  isAnomaly: boolean;
  headline: string;
  detail: string;
}

export interface ReportObjectWithFocus extends ReportObject {
  focus: YearPairResult | null;
  focusPairs: YearPairResult[]; // chosen window dates repeated for every year
  focusEventLabel?: string;
  trackedNeighborhoodId: string;
  trackedNeighborhoodName: string;
  anomaly: AnomalyAssessment;
}

function formatDeltaShort(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Compare focus window to a pre-filtered baseline of year-pairs.
 *
 * Identifies the top-mover neighborhood in the focus window (or uses
 * forceNeighborhoodId when both sections should track the same neighborhood),
 * then measures that neighborhood's delta across the provided baseline pairs.
 * Threshold is mean + 2 SD of the baseline deltas.
 *
 * Caller is responsible for filtering the baseline to only pre-event pairs —
 * this function uses the baseline as-is and does not drop any pairs internally.
 */
export function assessAnomaly(
  focus: YearPairResult | null,
  baseline: YearPairResult[],
  forceNeighborhoodId?: string
): AnomalyAssessment {
  if (!focus || focus.status !== "ok") {
    return {
      isAnomaly: false,
      headline: "Could not assess this window.",
      detail:
        focus?.status === "unavailable"
          ? "Selected window data unavailable."
          : "No focus comparison was run.",
    };
  }

  const forcedMover = forceNeighborhoodId
    ? focus.allMovers.find((m) => m.neighborhood_id === forceNeighborhoodId) ?? null
    : null;
  const trackingMover = forcedMover ?? focus.topPositive[0] ?? null;

  if (!trackingMover) {
    return {
      isAnomaly: false,
      headline: "Could not assess this window.",
      detail: "No neighborhoods with increased enforcement were found in the selected window.",
    };
  }

  const name = trackingMover.neighborhood_name;
  const nbrId = trackingMover.neighborhood_id;
  const focusDelta = trackingMover.delta;

  const okBaseline = baseline.filter((p) => p.status === "ok");

  // Track this neighborhood's delta in each historical year-pair
  const historicalDeltas = okBaseline
    .map((p) => p.allMovers.find((m) => m.neighborhood_id === nbrId)?.delta ?? null)
    .filter((d): d is number => d != null);

  const baselineRangeLabel =
    okBaseline.length > 0
      ? `${okBaseline[0].yearPair.label.replace(/[–—]/g, "-").split("-")[0]}-${
          okBaseline[okBaseline.length - 1].yearPair.label
            .replace(/[–—]/g, "-")
            .split("-")[1]
        }`
      : "prior years";

  const historicalMin =
    historicalDeltas.length > 0 ? Math.min(...historicalDeltas) : null;
  const historicalMax =
    historicalDeltas.length > 0 ? Math.max(...historicalDeltas) : null;

  const rangeText =
    historicalMin != null && historicalMax != null
      ? `${formatDeltaShort(historicalMin)} to ${formatDeltaShort(historicalMax)}`
      : "unavailable";

  let isAnomaly = false;
  let thresholdLabel = "";

  if (historicalDeltas.length >= 2) {
    const avg = mean(historicalDeltas);
    const sd = stdDev(historicalDeltas, avg);
    const threshold = avg + 2 * sd;
    isAnomaly = focusDelta > threshold;
    thresholdLabel = `mean + 2 SD = ${formatDeltaShort(threshold)}`;
  } else if (historicalMax != null) {
    // Fewer than 2 baseline years — fall back to above historical max
    isAnomaly = focusDelta > historicalMax;
    thresholdLabel = `above historical max of ${formatDeltaShort(historicalMax)}`;
  }

  if (isAnomaly) {
    return {
      isAnomaly: true,
      headline: "This window looks anomalous relative to prior years — investigate further.",
      detail: `Compared to ${baselineRangeLabel}, ${name}'s enforcement ratio change ranged from ${rangeText} (${thresholdLabel}). In the selected window, ${name} changed ${formatDeltaShort(focusDelta)} — above that threshold. This pattern warrants investigation; it does not establish cause.`,
    };
  }

  return {
    isAnomaly: false,
    headline: "This window is within the range of prior years.",
    detail: `Compared to ${baselineRangeLabel}, ${name}'s enforcement ratio change ranged from ${rangeText} (${thresholdLabel}). In the selected window, ${name} changed ${formatDeltaShort(focusDelta)} — within that historical range.`,
  };
}

export async function runReportWithFocus(
  config: ReportConfig,
  focusWindow: FocusWindow,
  onProgress?: (done: number, total: number, label: string) => void
): Promise<ReportObjectWithFocus> {
  const focusYearPair: YearPair = {
    label: focusWindow.label,
    baselineStart: focusWindow.baselineStart,
    baselineEnd: focusWindow.baselineEnd,
    compareStart: focusWindow.compareStart,
    compareEnd: focusWindow.compareEnd,
  };

  let focus: YearPairResult | null = null;
  try {
    const data = await fetchCompareData(
      focusWindow.baselineStart,
      focusWindow.baselineEnd,
      focusWindow.compareStart,
      focusWindow.compareEnd
    );
    focus = summarizeCompareResult(focusYearPair, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "data unavailable";
    focus = unavailablePair(focusYearPair, message);
  }

  // Build the same event-window pattern for every historical year BEFORE
  // assessing anomalies — both baselines are filtered from these lists.
  const focusPatternPairs = buildYearPairsFromFocus(
    focusWindow,
    config.startYear,
    config.endYear
  );
  const focusPairs: YearPairResult[] = [];
  for (let i = 0; i < focusPatternPairs.length; i++) {
    const yp = focusPatternPairs[i];
    onProgress?.(i, focusPatternPairs.length, yp.label);
    // Reuse already-fetched focus data for the matching year — no extra call.
    if (
      focus &&
      yp.baselineStart === focusWindow.baselineStart &&
      yp.compareStart === focusWindow.compareStart
    ) {
      focusPairs.push({ ...focus, yearPair: yp });
      continue;
    }
    try {
      const data = await fetchCompareData(
        yp.baselineStart,
        yp.baselineEnd,
        yp.compareStart,
        yp.compareEnd
      );
      focusPairs.push(summarizeCompareResult(yp, data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "data unavailable";
      focusPairs.push(unavailablePair(yp, message));
    }
  }
  onProgress?.(focusPatternPairs.length, focusPatternPairs.length, "done");

  // Anomaly baseline = pairs whose baseline year is strictly before the event
  // year. This excludes the event pair (being assessed) and any right-censored
  // pairs after it, so the threshold reflects only the pre-event period.
  const focusEventYear = parseInt(focusWindow.baselineStart.slice(0, 4));

  // Prefer the neighborhood the user selected; fall back to top mover.
  const defaultMover = focus?.status === "ok" ? (focus.topPositive[0] ?? null) : null;
  const requestedMover =
    focusWindow.neighborhoodId && focus?.status === "ok"
      ? (focus.allMovers.find((m) => m.neighborhood_id === focusWindow.neighborhoodId) ?? null)
      : null;
  const trackedMover = requestedMover ?? defaultMover;
  const focusNbrId = trackedMover?.neighborhood_id ?? undefined;
  const trackedNeighborhoodId = focusNbrId ?? "";
  const trackedNeighborhoodName = trackedMover?.neighborhood_name ?? "—";

  const eventBaseline = focusPairs.filter(
    (p) => parseInt(p.yearPair.baselineStart.slice(0, 4)) < focusEventYear
  );
  const anomaly = assessAnomaly(focus, eventBaseline, focusNbrId);

  return {
    config,
    generatedAt: new Date().toISOString(),
    pairs: [],
    rightCensored: config.endYear >= MAX_REPORT_YEAR,
    focus,
    focusPairs,
    focusEventLabel: focusWindow.eventLabel,
    trackedNeighborhoodId,
    trackedNeighborhoodName,
    anomaly,
  };
}