import { jsPDF } from "jspdf";
import type { ReportObjectWithFocus, YearPairResult } from "@/lib/generateReport";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SOURCES = [
  "SF Crime Incidents - DataSF (Socrata), 2018-present. https://www.sanfranciscopolice.org/stay-safe/crime-data/datasf",
  "Census population - US Census ACS. https://www.census.gov/programs-surveys/acs/data.html",
  "Neighborhood Boundaries - 41 SF analysis neighborhoods. https://data.sfgov.org/-/Analysis-Neighborhoods/p5b7-5n3h",
];

function monthLabel(m: number): string {
  return MONTHS[m - 1] ?? String(m);
}

function formatDelta(delta: number | null): string {
  if (delta == null) return "-";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

function pairLabel(pair: YearPairResult): string {
  const raw = pair.yearPair.label.replace(/[–—]/g, "-");
  const [a, b] = raw.split("-");
  return a === b ? a : raw;
}

function neighborhoodDeltaFromPair(pair: YearPairResult, neighborhoodId: string): string {
  if (pair.status !== "ok" || !neighborhoodId) return "-";
  const mover = pair.allMovers.find((m) => m.neighborhood_id === neighborhoodId);
  return mover != null ? formatDelta(mover.delta) : "-";
}

function windowLine(pair: YearPairResult): string {
  const y = pair.yearPair;
  return `${y.baselineStart.slice(0, 7)} to ${y.baselineEnd.slice(0, 7)} vs ${y.compareStart.slice(0, 7)} to ${y.compareEnd.slice(0, 7)}`;
}

function drawWrappedCentered(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, centerX, y, { align: "center", maxWidth });
  return y + lines.length * lineHeight;
}

export function exportReportPdf(report: ReportObjectWithFocus): void {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const centerX = pageW / 2;
  const margin = 14;
  const contentW = pageW - margin * 2;

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LENS Enforcement Comparison Report", centerX, y, {
    align: "center",
  });
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const focusNbrId = report.trackedNeighborhoodId;
  const focusNbrName = report.trackedNeighborhoodName;

  function mLabel(d: string) {
    return MONTHS[parseInt(d.slice(5, 7)) - 1] ?? d.slice(5, 7);
  }

  if (report.focusPairs && report.focusPairs.length > 0) {
    const fp0 = report.focusPairs[0].yearPair;
    const windowDesc = `${mLabel(fp0.baselineStart)}-${mLabel(fp0.baselineEnd)} vs ${mLabel(fp0.compareStart)}-${mLabel(fp0.compareEnd)}`;
    const eventSuffix = report.focusEventLabel ? ` — ${report.focusEventLabel}` : "";
    y = drawWrappedCentered(
      doc,
      `${windowDesc} each year, ${report.config.startYear}-${report.config.endYear}${eventSuffix}`,
      centerX,
      y,
      contentW
    );
    y += 8;
  }

  function drawTableHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Period", margin, y);
    doc.text("Delta", margin + 100, y);
    doc.text("City median", margin + 140, y);
    y += 5;
    doc.setFont("helvetica", "normal");
  }

  function drawPairRow(pair: YearPairResult, label: string, bold: boolean) {
    if (bold) doc.setFont("helvetica", "bold");
    if (pair.status === "unavailable") {
      doc.text(`${label} — data unavailable`, margin, y);
    } else {
      doc.text(label, margin, y);
      doc.text(neighborhoodDeltaFromPair(pair, focusNbrId), margin + 100, y);
      doc.text(formatDelta(pair.citywideMedianDelta), margin + 140, y);
    }
    y += 5;
    if (bold) doc.setFont("helvetica", "normal");
  }

  // Pattern assessment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    report.anomaly.isAnomaly
      ? "Pattern: anomalous relative to prior years — investigate further"
      : "Pattern: within range of prior years",
    centerX,
    y,
    { align: "center" }
  );
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const findingSummary = [report.anomaly.headline, report.anomaly.detail].filter(Boolean).join(" ");
  y = drawWrappedCentered(doc, findingSummary, centerX, y, contentW);
  y += 3;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Tracking: ${focusNbrName}`, centerX, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  y += 8;

  // Table
  if (report.focusPairs && report.focusPairs.length > 0) {
    const fp0 = report.focusPairs[0].yearPair;
    const windowDesc = `${mLabel(fp0.baselineStart)}-${mLabel(fp0.baselineEnd)} vs ${mLabel(fp0.compareStart)}-${mLabel(fp0.compareEnd)}`;
    const eventLabel = report.focusEventLabel ? ` — ${report.focusEventLabel}` : "";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${windowDesc} each year${eventLabel}`, margin, y);
    y += 5;
    drawTableHeader();
    doc.setFontSize(9);

    for (const pair of report.focusPairs) {
      const isSelected =
        report.focus != null &&
        pair.yearPair.baselineStart === report.focus.yearPair.baselineStart &&
        pair.yearPair.compareStart === report.focus.yearPair.compareStart;
      const rowLabel = isSelected
        ? `${pairLabel(pair)} (selected)`
        : pairLabel(pair);
      drawPairRow(pair, rowLabel, isSelected);
    }
  }

  y += 6;

  // ── DATA FLAG ────────────────────────────────────────────────────────
  if (report.rightCensored) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Data flag: right-censoring", centerX, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    y = drawWrappedCentered(
      doc,
      `The ${report.config.endYear - 1}-${report.config.endYear} comparison includes recent months that may still be accumulating reports. Treat this period as provisional — clearance rates and incident counts are likely understated at the trailing edge.`,
      centerX,
      y,
      contentW,
      4
    );
    y += 6;
  }

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Methodology note", centerX, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y = drawWrappedCentered(
    doc,
    "This report shows patterns in police-recorded enforcement data. It does not measure crime. Enforcement records reflect where officers were present, not where crime occurred. All findings are observational — correlation with a policy event does not establish causation. Each row uses the same before/after month structure as the selected event, applied to every year in the range, so all years are directly comparable. The anomaly threshold is mean + 2 standard deviations of the tracked neighborhood's own pre-event historical deltas; the event year and any right-censored years are excluded from the baseline. Analysts should investigate further before citing findings in a report or hearing.",
    centerX,
    y,
    contentW,
    4
  );
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Sources", centerX, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const source of SOURCES) {
    y = drawWrappedCentered(doc, source, centerX, y, contentW, 4);
    y += 2;
  }

  const { startYear, endYear } = report.config;
  const filename = `lens-anomaly-report-${startYear}-${endYear}.pdf`;
  doc.save(filename);
}
