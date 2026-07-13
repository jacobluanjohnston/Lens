"use client";

import type { LensData } from "@/types/lens";

interface NeighborhoodPanelProps {
  neighborhood: LensData | null;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
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

        boxShadow:
          "0 4px 12px rgba(0,0,0,.08), inset 0 1px 1px rgba(255,255,255,.18)",
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
        }}
      >
        {label}
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
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,

        background: active
          ? "rgba(34,197,94,.14)"
          : "rgba(148,163,184,.14)",

        border: active
          ? "1px solid rgba(34,197,94,.22)"
          : "1px solid rgba(148,163,184,.18)",

        color: active ? "#15803d" : "#475569",

        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {active ? "✓ " : "• "}
      {label}
    </div>
  );
}

export default function NeighborhoodPanel({
  neighborhood,
}: NeighborhoodPanelProps) {
  if (!neighborhood) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,.14)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",

          borderRadius: 22,
          padding: 24,

          border: "1px solid rgba(255,255,255,.22)",

          boxShadow:
            "0 12px 40px rgba(15,23,42,.18), inset 0 1px 1px rgba(255,255,255,.25)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            color: "#111827",
          }}
        >
          Neighborhood
        </h2>

        <p
          style={{
            color: "#4b5563",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Click a neighborhood on the map to view detailed metrics and
          comparison data.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",

        borderRadius: 22,
        padding: 24,

        border: "1px solid rgba(255,255,255,.22)",

        boxShadow:
          "0 12px 40px rgba(15,23,42,.18), inset 0 1px 1px rgba(255,255,255,.25)",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 6,
          }}
        >
          Selected Neighborhood
        </div>

        <h2
          style={{
            margin: 0,
            color: "#111827",
          }}
        >
          {neighborhood.neighborhood_name}
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Metric
          label="Incidence"
          value={neighborhood.raw_count}
        />

        <Metric
          label="Officer Enforcement"
          value={neighborhood.value ?? "N/A"}
        />

        <Metric
          label="Resolution Gap"
          value={neighborhood.gap ?? "N/A"}
        />
      </div>

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#475569",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Citywide Reference
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            fontSize: 14,
            color: "#334155",
          }}
        >
          <div>
            <strong>Reference Count:</strong>{" "}
            {neighborhood.reference_raw}
          </div>

          <div>
            <strong>Reference Value:</strong>{" "}
            {neighborhood.reference_value}
          </div>

          <div>
            <strong>Reference Rate:</strong>{" "}
            {neighborhood.reference_rate}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#475569",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Flags
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Badge
            label="Low Confidence"
            active={neighborhood.low_confidence}
          />

          <Badge
            label="Per Capita"
            active={neighborhood.per_capita_applicable}
          />

          <Badge
            label="Provisional"
            active={neighborhood.provisional}
          />
        </div>
      </div>
    </div>
  );
}