"use client";

import type { LensData } from "@/types/lens";

interface NeighborhoodPanelProps {
  neighborhood: LensData | null;
  activeLens: 1 | 2 | 3;
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
      "How many incidents were reported here? High counts may reflect patrol intensity, not actual crime — officers in the area generate more reports.",
  },
  2: {
    label: "Lens 2 — Officer Enforcement",
    description:
      "How much officer-initiated activity relative to victim-reported crime? Compares proactive incidents (drug stops, warrants, loitering) to serious victim-reported crimes (burglary, robbery, assault, motor vehicle theft).",
  },
  3: {
    label: "Lens 3 — Resolution Gap",
    description:
      "Do crimes here get resolved at the same rate as the same crime citywide? A negative gap means cases here close at a lower rate than comparable areas.",
  },
};

function Info({ tip }: { tip: string }) {
  return (
    <span
      title={tip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 15,
        height: 15,
        borderRadius: "50%",
        border: "1px solid #94a3b8",
        color: "#94a3b8",
        fontSize: 9,
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
}: {
  label: string;
  value: string | number;
  tip: string;
}) {
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
          fontSize: 12,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: 8,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
        }}
      >
        {label}
        <Info tip={tip} />
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({
  label,
  active,
  tip,
}: {
  label: string;
  active: boolean;
  tip: string;
}) {
  return (
    <div
      title={tip}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        background: active ? "rgba(251,191,36,.18)" : "rgba(148,163,184,.14)",
        border: active ? "1px solid rgba(251,191,36,.35)" : "1px solid rgba(148,163,184,.18)",
        color: active ? "#92400e" : "#475569",
        fontSize: 13,
        fontWeight: 600,
        cursor: "help",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {active ? "⚠" : "•"} {label}
    </div>
  );
}

export default function NeighborhoodPanel({
  neighborhood,
  activeLens,
}: NeighborhoodPanelProps) {
  const meta = LENS_META[activeLens];

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

  return (
    <div style={GLASS}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 4,
          }}
        >
          {meta.label}
        </div>

        <h2 style={{ margin: 0, marginBottom: 8, color: "#111827" }}>
          {neighborhood.neighborhood_name}
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {meta.description}
        </p>
      </div>

      {/* Lens-specific metrics */}
      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {activeLens === 1 && (
          <>
            <Metric
              label="Total Incidents"
              value={neighborhood.raw_count ?? "—"}
              tip="All reported incidents in the selected date range. Includes every category. This number is contaminated by patrol intensity — more officers in an area generate more reports."
            />
            <Metric
              label="Per 1,000 Residents"
              value={
                neighborhood.per_capita != null
                  ? neighborhood.per_capita
                  : "Not applicable"
              }
              tip="Incidents per 1,000 residents. Strips out the trivial fact that bigger neighborhoods have more of everything. Not shown for non-residential areas like parks or the Farallones."
            />
            <div style={{ fontSize: 13, color: "#475569" }}>
              <span style={{ fontWeight: 600 }}>City median:</span>{" "}
              {neighborhood.reference_raw ?? "—"} incidents
              <Info tip="The citywide median raw count across all 41 neighborhoods for this date range. The median (not mean) is used to avoid outlier neighborhoods skewing the reference." />
            </div>
          </>
        )}

        {activeLens === 2 && (
          <>
            <Metric
              label="Enforcement Ratio"
              value={
                neighborhood.value != null
                  ? `${neighborhood.value} per 100`
                  : "Not applicable"
              }
              tip="Officer-initiated incidents per 100 victim-reported serious crimes (burglary, robbery, assault, motor vehicle theft). A ratio of 84 means 84 drug stops / warrants / loitering arrests for every 100 burglary or assault reports. High values may signal patrol-driven enforcement rather than response to victim need."
            />
            <div style={{ fontSize: 13, color: "#475569" }}>
              <span style={{ fontWeight: 600 }}>City median:</span>{" "}
              {neighborhood.reference_value ?? "—"} per 100
              <Info tip="The citywide median enforcement ratio. Neighborhoods significantly above this value are flagged as potential enforcement proxies — places where officer activity is high relative to victim-reported crime." />
            </div>
          </>
        )}

        {activeLens === 3 && (
          <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>
            Lens 3 is not yet available — assault category surgery pending.
          </div>
        )}
      </div>

      {/* Flags */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#475569",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Data flags
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge
            label="Low confidence"
            active={neighborhood.low_confidence}
            tip="A high proportion of incidents in this neighborhood could not be geocoded or matched to a neighborhood boundary. Statistics here may undercount actual activity. The gap itself may not be random — geocoding failure rates vary by neighborhood and correlate with data-quality disparities."
          />

          <Badge
            label="Per capita N/A"
            active={!neighborhood.per_capita_applicable}
            tip="This area has no resident population (e.g., a park, industrial zone, or the Farallones). Dividing incident counts by population is not meaningful here — per-capita figures are suppressed."
          />

          <Badge
            label="Provisional"
            active={neighborhood.provisional ?? false}
            tip="The selected date range ends within the last 90 days. Incident reports for recent months are still being filed and updated, so counts are likely lower than their final values. Before-after comparisons that cross into this window are especially unreliable."
          />
        </div>
      </div>
    </div>
  );
}
