"use client";

import type { LensData } from "@/types/lens";
import type { CompareData } from "@/types/compare";
import { metricFor } from "@/lib/lensLogic";

interface RankingsPanelProps {
  compareMode: boolean;
  activeLens: 1 | 2 | 3;
  lens1Mode: "raw" | "per_capita";
  lensData: LensData[];
  compareData: CompareData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatMetric(
  compareMode: boolean,
  activeLens: 1 | 2 | 3,
  lens1Mode: "raw" | "per_capita",
  value: number | null
): string {
  if (value == null) return "—";
  if (compareMode) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}`;
  }
  if (activeLens === 1 && lens1Mode === "raw") {
    return Math.round(value).toLocaleString();
  }
  return value.toFixed(1);
}

export default function RankingsPanel({
  compareMode,
  activeLens,
  lens1Mode,
  lensData,
  compareData,
  selectedId,
  onSelect,
}: RankingsPanelProps) {
  const source = compareMode ? compareData : lensData;

  const ranked = [...source].sort((a, b) => {
    const aVal = metricFor(compareMode, activeLens, lens1Mode, a);
    const bVal = metricFor(compareMode, activeLens, lens1Mode, b);
    // nulls last
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    return bVal - aVal; // highest first
  });

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
        color: "#111827",
        maxHeight: 320,
        overflowY: "auto",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        Neighborhood Rankings
      </h2>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {ranked.map((row, index) => {
          const value = metricFor(compareMode, activeLens, lens1Mode, row);
          return (
            <div
              key={row.neighborhood_id}
              onClick={() => onSelect(row.neighborhood_id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 12,
                fontSize: 13,
                cursor: "pointer",
                background:
                  row.neighborhood_id === selectedId
                    ? "rgba(15, 23, 42, 0.12)"
                    : "transparent",
              }}
            >
              <span style={{ width: 24, fontWeight: 700, color: "#64748b" }}>
                {index + 1}
              </span>
              <span style={{ flex: 1, fontWeight: 600 }}>
                {row.neighborhood_name}
              </span>
              <span style={{ fontWeight: 600, color: "#334155" }}>
                {formatMetric(compareMode, activeLens, lens1Mode, value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
