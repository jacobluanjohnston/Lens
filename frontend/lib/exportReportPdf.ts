import { jsPDF } from "jspdf";
import type { ReportObject, YearPairResult, Mover } from "@/lib/generateReport";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(m: number): string {
  return MONTHS[m - 1] ?? String(m);
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

function formatRatio(value: number | null): string {
  if (value == null) return "n/a";
  return value.toFixed(1);
}

function magnitudeParts(delta: number): { verb: string; sizeClause: string } {
  const abs = Math.abs(delta);
  if (delta >= 0) {
    if (abs < 5) return { verb: "edged up", sizeClause: "a small rise" };
    if (abs < 20) return { verb: "rose", sizeClause: "a moderate rise" };
    if (abs < 50) return { verb: "jumped", sizeClause: "a large rise" };
    return { verb: "surged", sizeClause: "a sharp rise" };
  }
  if (abs < 5) return { verb: "edged down", sizeClause: "a small drop" };
  if (abs < 20) return { verb: "fell", sizeClause: "a moderate drop" };
  if (abs < 50) return { verb: "dropped", sizeClause: "a large drop" };
  return { verb: "plunged", sizeClause: "a sharp drop" };
}

function vsCityPhrase(
  delta: number,
  median: number | null,
  sizeClause: string
): string {
  if (median == null) return sizeClause;
  const gap = delta - median;
  if (Math.abs(gap) < 5) {
    return `${sizeClause} near the city middle`;
  }
  if (gap > 0) {
    return `well above the city typical change ${formatDelta(median)}`;
  }
  return `${sizeClause} versus the city typical change ${formatDelta(median)}`;
}

/** One unique line per neighborhood — ASCII only for jsPDF Helvetica. */
function summaryLine(
  m: Mover,
  rank: number,
  median: number | null
): string {
  const change = formatDelta(m.delta);
  const from = formatRatio(m.baseline_ratio);
  const to = formatRatio(m.compare_ratio);
  const { verb, sizeClause } = magnitudeParts(m.delta);
  const vs = vsCityPhrase(m.delta, median, sizeClause);

  let lead: string;
  if (m.delta > 0 && rank === 1) {
    lead = `${m.neighborhood_name}: had the largest increase ${change}, rising from ${from} to ${to} police stops per 100 crime reports`;
  } else if (m.delta < 0 && rank === 1) {
    lead = `${m.neighborhood_name}: fell the most ${change}, from ${from} to ${to} police stops per 100 crime reports`;
  } else {
    lead = `${m.neighborhood_name}: ${verb} ${change}, from ${from} to ${to} police stops per 100 crime reports`;
  }

  return `${lead} - ${vs}.`;
}

function drawMoversTable(
  doc: jsPDF,
  title: string,
  movers: Mover[],
  startY: number
): number {
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (movers.length === 0) {
    doc.text("None", 14, y);
    return y + 8;
  }

  for (const m of movers) {
    doc.text(`${m.neighborhood_name}`, 14, y);
    doc.text(formatDelta(m.delta), 140, y);
    y += 5;
  }
  return y + 4;
}

function drawPairPage(
  doc: jsPDF,
  report: ReportObject,
  pair: YearPairResult,
  pageIndex: number
) {
  if (pageIndex > 0) doc.addPage();

  const { config } = report;
  const rangeLabel = `${monthLabel(config.startMonth)}-${monthLabel(config.endMonth)}`;
  const { yearPair } = pair;
  // jsPDF Helvetica can't render Unicode dashes/arrows — keep ASCII only
  const pairLabel = yearPair.label.replace(/[–—]/g, "-");
  const centerX = doc.internal.pageSize.getWidth() / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LENS Year-over-Year Enforcement Report", centerX, 18, {
    align: "center",
  });

  doc.setFontSize(13);
  doc.text(`Year pair: ${pairLabel}`, centerX, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Base month range: ${rangeLabel} each year`, centerX, 36, {
    align: "center",
  });
  doc.text(
    `Baseline: ${yearPair.baselineStart.slice(0, 7)} to ${yearPair.baselineEnd.slice(0, 7)}`,
    centerX,
    42,
    { align: "center" }
  );
  doc.text(
    `Compare: ${yearPair.compareStart.slice(0, 7)} to ${yearPair.compareEnd.slice(0, 7)}`,
    centerX,
    48,
    { align: "center" }
  );

  if (pair.status === "unavailable") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("data unavailable", centerX, 64, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (pair.errorMessage) {
      doc.text(pair.errorMessage, 14, 72, { maxWidth: 180 });
    }
    return;
  }

  doc.text(
    `Median change across neighborhoods: ${
      pair.citywideMedianDelta == null
        ? "-"
        : formatDelta(pair.citywideMedianDelta)
    }`,
    centerX,
    56,
    { align: "center" }
  );

  let y = drawMoversTable(
    doc,
    "Neighborhoods with the biggest increases:",
    pair.topPositive,
    66
  );
  y = drawMoversTable(
    doc,
    "Neighborhoods with the biggest decreases:",
    pair.topNegative,
    y
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Summaries of each neighborhood:", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const summaryEntries: { mover: Mover; rank: number }[] = [
    ...pair.topPositive.map((mover, i) => ({ mover, rank: i + 1 })),
    ...pair.topNegative.map((mover, i) => ({ mover, rank: i + 1 })),
  ];

  for (const { mover, rank } of summaryEntries) {
    const lines = doc.splitTextToSize(
      summaryLine(mover, rank, pair.citywideMedianDelta),
      180
    );
    doc.text(lines, 14, y);
    y += lines.length * 4 + 2;
    if (y > 270) {
      doc.addPage();
      y = 18;
    }
  }
}

/** Builds the PDF and triggers a download (does not open a new tab). */
export function exportReportPdf(report: ReportObject): void {
  const doc = new jsPDF();

  report.pairs.forEach((pair, i) => {
    drawPairPage(doc, report, pair, i);
  });

  const { startYear, endYear, startMonth, endMonth } = report.config;
  const filename = `lens-yoy-report-${startYear}-${endYear}_${monthLabel(startMonth)}-${monthLabel(endMonth)}.pdf`;
  doc.save(filename);
}