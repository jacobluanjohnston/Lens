"use client";

import type { LensData } from "@/types/lens";
import type { CompareData } from "@/types/compare";

interface NeighborhoodPanelProps {
  neighborhood: LensData | null;
  compareMode: boolean;
  compareNeighborhood: CompareData | null;
  compareRanges: {
    baselineStart: string;
    baselineEnd: string;
    compareStart: string;
    compareEnd: string;
  };
  activeLens: 1 | 2 | 3;
  lens1Mode: "raw" | "per_capita";
  dateRange: { start: string; end: string };
  onFixProvisional: () => void;
}

const GLASS = {
  background: "rgba(255,255,255,.14)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  borderRadius: 22,
  padding: 24,
  border: "1px solid rgba(255,255,255,.22)",
  boxShadow: "0 12px 40px rgba(15,23,42,.18), inset 0 1px 1px rgba(255,255,255,.25)",
} as const;

const LENS_META: Record<1 | 2 | 3, { label: string; description: string }> = {
  1: {
    label: "Lens 1 — Incidence",
    description:
      "How many incidents were reported here? High counts may reflect patrol intensity, not actual crime — more officers in an area generate more reports.",
  },
  2: {
    label: "Lens 2 — Officer Enforcement",
    description:
      "How much officer-initiated activity relative to victim-reported crime? Compares proactive incidents (drug stops, warrants, prostitution) to serious victim-reported crimes (burglary, robbery, assault, vehicle theft).",
  },
  3: {
    label: "Lens 3 — Resolution Gap",
    description:
      "Do crimes here get resolved at the same rate as elsewhere? A negative gap means cases close at a lower rate than comparable areas citywide.",
  },
};

function fmtMonth(iso: string) {
  const [y, m] = iso.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

// Returns the first of the month 3 months before today — outside the 90-day provisional window.
function stableEndDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  d.setDate(1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function Info({ tip }: { tip: string }) {
  return (
    <span
      title={tip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "1px solid #94a3b8",
        color: "#94a3b8",
        fontSize: 8,
        fontWeight: 700,
        cursor: "help",
        marginLeft: 5,
        flexShrink: 0,
        verticalAlign: "middle",
        lineHeight: 1,
      }}
    >
      i
    </span>
  );
}

function Metric({
  label,
  value,
  tip,
  comparison,
  delta,
  valueColor,
}: {
  label: string;
  value: string | number;
  tip?: string;
  comparison?: string;
  delta?: number;
  valueColor?: string;
}) {
  const deltaLabel = delta != null
    ? `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% ${delta >= 0 ? "above" : "below"} median`
    : null;
  const deltaColor = delta == null ? undefined : delta >= 0 ? "#b45309" : "#2563eb";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 4px 12px rgba(0,0,0,.08), inset 0 1px 1px rgba(255,255,255,.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: 6,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
        }}
      >
        {label}
        {tip && <Info tip={tip} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: valueColor ?? "#111827" }}>
        {value}
      </div>
      {comparison && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
          {comparison}
        </div>
      )}
      {deltaLabel && (
        <div style={{ fontSize: 11, fontWeight: 600, color: deltaColor, marginTop: 3 }}>
          {deltaLabel}
        </div>
      )}
    </div>
  );
}

function Flag({
  flagKey,
  active,
  onFix,
}: {
  flagKey: string;
  active: boolean;
  onFix?: () => void;
}) {
  const FLAGS: Record<string, { what: string; why: string; fix?: string }> = {
    low_confidence: {
      what: "High geocoding failure rate",
      why: "Many incidents here couldn't be placed on the map, so counts likely understate actual activity. The failure rate isn't random — it correlates with data-quality disparities across neighborhoods.",
    },
    per_capita_na: {
      what: "No resident population",
      why: "This area (e.g. a park, industrial zone, or the Farallones) has no residents to divide by. Per-capita figures are suppressed to avoid meaningless numbers.",
    },
    provisional: {
      what: "Recent data — may be incomplete",
      why: "The date range ends within the last 90 days. Reports for recent months are still being filed and updated, so counts are likely lower than their final values.",
      fix: `Move end date to ${fmtMonth(stableEndDate())}`,
    },
  };

  const info = FLAGS[flagKey];
  if (!info) return null;

  return (
    <div
      style={{
        borderRadius: 12,
        padding: "10px 12px",
        background: active ? "rgba(251,191,36,.12)" : "rgba(148,163,184,.08)",
        border: active
          ? "1px solid rgba(251,191,36,.30)"
          : "1px solid rgba(148,163,184,.15)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: active ? "#92400e" : "#94a3b8",
          marginBottom: active ? 4 : 0,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span>{active ? "⚠" : "✓"}</span>
        <span>{info.what}</span>
      </div>

      {active && (
        <>
          <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.45, marginBottom: info.fix ? 8 : 0 }}>
            {info.why}
          </div>

          {info.fix && onFix && (
            <button
              onClick={onFix}
              style={{
                marginTop: 2,
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid rgba(251,191,36,.45)",
                background: "rgba(251,191,36,.18)",
                color: "#92400e",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {info.fix} →
            </button>
          )}
          {info.fix && !onFix && (
            <div style={{ marginTop: 4, fontSize: 11, color: "#92400e", fontWeight: 600 }}>
              We suggest moving end dates to {fmtMonth(stableEndDate())}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function NeighborhoodPanel({
  neighborhood,
  compareMode,
  compareNeighborhood,
  compareRanges,
  activeLens,
  lens1Mode,
  dateRange,
  onFixProvisional,
}: NeighborhoodPanelProps) {
  const meta = LENS_META[activeLens];

  if (compareMode) {
    if (!compareNeighborhood) {
      return (
        <div style={GLASS}>
          <h2 style={{ marginTop: 0, marginBottom: 8, color: "#111827", fontSize: 18 }}>
            Enforcement change
          </h2>
          <p style={{ color: "#4b5563", lineHeight: 1.6, margin: 0, fontSize: 13 }}>
            Click a neighborhood to compare its before and after enforcement ratios.
          </p>
        </div>
      );
    }

    const percentageChange =
      compareNeighborhood.baseline_ratio !== null &&
      compareNeighborhood.baseline_ratio !== 0 &&
      compareNeighborhood.compare_ratio !== null
        ? ((compareNeighborhood.compare_ratio - compareNeighborhood.baseline_ratio) /
            compareNeighborhood.baseline_ratio) * 100
        : null;
    const deltaColor = compareNeighborhood.delta === null || compareNeighborhood.delta === 0
      ? "#64748b"
      : compareNeighborhood.delta > 0
        ? "#b45309"
        : "#2563eb";
    const percentageColor = percentageChange === null || percentageChange === 0
      ? "#64748b"
      : percentageChange > 0
        ? "#b45309"
        : "#2563eb";

    return (
      <div style={GLASS}>
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 3,
            }}
          >
            Lens 2 — Officer Enforcement — Custom date
          </div>
          <h2 style={{ margin: 0, marginBottom: 6, color: "#111827", fontSize: 18 }}>
            {compareNeighborhood.neighborhood_name}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
            Officer-initiated incidents per 100 victim-reported serious crimes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Metric
            label="Before ratio"
            value={compareNeighborhood.baseline_ratio === null
              ? "Not applicable"
              : `${compareNeighborhood.baseline_ratio} per 100`}
            comparison={`${fmtMonth(compareRanges.baselineStart)} – ${fmtMonth(compareRanges.baselineEnd)}`}
          />
          <Metric
            label="After ratio"
            value={compareNeighborhood.compare_ratio === null
              ? "Not applicable"
              : `${compareNeighborhood.compare_ratio} per 100`}
            comparison={`${fmtMonth(compareRanges.compareStart)} – ${fmtMonth(compareRanges.compareEnd)}`}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Metric
            label="Delta"
            value={compareNeighborhood.delta === null
              ? "Not applicable"
              : `${compareNeighborhood.delta > 0 ? "+" : ""}${compareNeighborhood.delta}`}
            valueColor={deltaColor}
          />
          <Metric
            label="% change"
            value={percentageChange === null
              ? "Not applicable"
              : `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`}
            valueColor={percentageColor}
          />
        </div>

        {neighborhood && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Data flags
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Flag flagKey="low_confidence" active={neighborhood.low_confidence} />
              <Flag flagKey="per_capita_na" active={!neighborhood.per_capita_applicable} />
              <Flag
                flagKey="provisional"
                active={(Date.now() - new Date(compareRanges.compareEnd).getTime()) / 86_400_000 < 90}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div style={GLASS}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: "#111827" }}>
          Neighborhood
        </h2>
        <p style={{ color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
          Click a neighborhood on the map to view detailed metrics and
          comparison data.
        </p>
      </div>
    );
  }

  const periodLabel = `${fmtMonth(dateRange.start)} – ${fmtMonth(dateRange.end)}`;

  return (
    <div style={GLASS}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 3,
          }}
        >
          {meta.label} · {periodLabel}
        </div>

        <h2 style={{ margin: 0, marginBottom: 6, color: "#111827", fontSize: 18 }}>
          {neighborhood.neighborhood_name}
        </h2>

        <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
          {meta.description}
        </p>
      </div>

      {/* Lens-specific metrics */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {activeLens === 1 && (
          <>
            <div style={{ opacity: lens1Mode === "raw" ? 1 : 0.4, transition: "opacity .2s" }}>
              <Metric
                label="Total Incidents"
                value={neighborhood.raw_count?.toLocaleString() ?? "—"}
                comparison={
                  neighborhood.reference_raw != null
                    ? `Compared to the City Median of ${Math.round(neighborhood.reference_raw).toLocaleString()}`
                    : undefined
                }
                delta={
                  neighborhood.raw_count != null && neighborhood.reference_raw != null
                    ? ((neighborhood.raw_count - neighborhood.reference_raw) / neighborhood.reference_raw) * 100
                    : undefined
                }
              />
            </div>
            <div style={{ opacity: lens1Mode === "per_capita" ? 1 : 0.4, transition: "opacity .2s" }}>
              <Metric
                label="Per 1,000 Residents"
                value={
                  neighborhood.per_capita != null
                    ? neighborhood.per_capita
                    : "Not applicable"
                }
                comparison={
                  neighborhood.per_capita != null && neighborhood.reference_per_capita != null
                    ? `Compared to the City Median of ${Number(neighborhood.reference_per_capita).toFixed(2)}`
                    : undefined
                }
                delta={
                  neighborhood.per_capita != null && neighborhood.reference_per_capita != null
                    ? ((Number(neighborhood.per_capita) - Number(neighborhood.reference_per_capita)) / Number(neighborhood.reference_per_capita)) * 100
                    : undefined
                }
              />
            </div>
          </>
        )}

        {activeLens === 2 && (
          <Metric
            label="Enforcement Ratio"
            value={
              neighborhood.value != null
                ? `${neighborhood.value} per 100`
                : "Not applicable"
            }
            comparison={
              neighborhood.value != null && neighborhood.reference_value != null
                ? `Compared to the City Median of ${neighborhood.reference_value} per 100`
                : undefined
            }
            delta={
              neighborhood.value != null && neighborhood.reference_value != null
                ? ((Number(neighborhood.value) - Number(neighborhood.reference_value)) / Number(neighborhood.reference_value)) * 100
                : undefined
            }
          />
        )}

        {activeLens === 3 && (
          <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>
            Lens 3 is not yet available — assault category surgery pending.
          </div>
        )}
      </div>

      {/* Data flags */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#475569",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Data flags
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Flag flagKey="low_confidence" active={neighborhood.low_confidence} />
          <Flag flagKey="per_capita_na" active={!neighborhood.per_capita_applicable} />
          <Flag
            flagKey="provisional"
            active={neighborhood.provisional ?? false}
            onFix={onFixProvisional}
          />
        </div>
      </div>
    </div>
  );
}
