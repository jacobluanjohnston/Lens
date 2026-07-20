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
  return pair.yearPair.label.replace(/[–—]/g, "-");
}

function topMoverName(pair: YearPairResult): string {
  if (pair.status !== "ok" || pair.topPositive.length === 0) return "-";
  return pair.topPositive[0].neighborhood_name;
}

function topMoverDelta(pair: YearPairResult): string {
  if (pair.status !== "ok" || pair.topPositive.length === 0) return "-";
  return formatDelta(pair.topPositive[0].delta);
}

function windowLine(pair: YearPairResult): string {
  const y = pair.yearPair;
  return `${y.baselineStart.slice(0, 7)} to ${y.baselineEnd.slice(0, 7)} vs ${y.compareStart.slice(0, 7)} to ${y.compareEnd.slice(0, 7)}`;
}

function drawWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
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
  doc.text("LENS Year-over-Year Enforcement Report", centerX, y, {
    align: "center",
  });
  y += 12;

  const rangeLabel = `${monthLabel(report.config.startMonth)}-${monthLabel(report.config.endMonth)}`;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  y = drawWrappedCentered(
    doc,
    `Baseline: ${rangeLabel} month range across ${report.config.startYear}-${report.config.endYear}.`,
    centerX,
    y,
    contentW
  );
  y += 4;

  if (report.focus) {
    doc.setFont("helvetica", "bold");
    const dates = windowLine(report.focus);
    const eventSuffix = report.focusEventLabel
      ? ` (${report.focusEventLabel})`
      : "";
    y = drawWrappedCentered(
      doc,
      `Selected window: ${dates}${eventSuffix}`,
      centerX,
      y,
      contentW
    );
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    report.anomaly.isAnomaly
      ? "Finding: Likely an anomaly"
      : "Finding: typical year-over-year pattern",
    centerX,
    y,
    { align: "center" }
  );
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findingSummary = [report.anomaly.headline, report.anomaly.detail]
    .filter(Boolean)
    .join(" ");
  y = drawWrappedCentered(doc, findingSummary, centerX, y, contentW);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Year-by-year comparison", centerX, y, { align: "center" });
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Period", margin, y);
  doc.text("Top increase", margin + 55, y);
  doc.text("Change", margin + 115, y);
  doc.text("City median", margin + 145, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const rows: YearPairResult[] = [...report.pairs];
  if (report.focus) rows.push(report.focus);

  for (const pair of rows) {
    if (pair.status === "unavailable") {
      doc.text(`${pairLabel(pair)} - data unavailable`, margin, y);
      y += 5;
      continue;
    }

    const isFocus =
      report.focus != null &&
      pair.yearPair.baselineStart === report.focus.yearPair.baselineStart &&
      pair.yearPair.compareStart === report.focus.yearPair.compareStart;

    if (isFocus) doc.setFont("helvetica", "bold");

    doc.text(
      isFocus ? `${pairLabel(pair)} (selected)` : pairLabel(pair),
      margin,
      y
    );
    doc.text(topMoverName(pair), margin + 55, y);
    doc.text(topMoverDelta(pair), margin + 115, y);
    doc.text(formatDelta(pair.citywideMedianDelta), margin + 145, y);
    y += 5;

    doc.setFont("helvetica", "normal");
  }

  y += 8;
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

  const { startYear, endYear, startMonth, endMonth } = report.config;
  const filename = `lens-anomaly-report-${startYear}-${endYear}_${monthLabel(startMonth)}-${monthLabel(endMonth)}.pdf`;
  doc.save(filename);
}
