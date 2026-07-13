"use client";

import type { LensData } from "@/types/lens";

interface NeighborhoodPanelProps {
  neighborhood: LensData | null;
}

export default function NeighborhoodPanel({
  neighborhood,
}: NeighborhoodPanelProps) {
  if (!neighborhood) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          color: "#222",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#111",
          }}
        >
          Neighborhood
        </h2>

        <p style={{ color: "#666" }}>
          Click a neighborhood to view its lens metrics.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        color: "#222",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#111",
        }}
      >
        {neighborhood.neighborhood_name}
      </h2>

      <hr />

      <h3 style={{ color: "#111" }}>Lens Metrics</h3>

      <p>
        <strong>Incidence:</strong> {neighborhood.raw_count}
      </p>

      <p>
        <strong>Officer Enforcement:</strong>{" "}
        {neighborhood.value ?? "N/A"}
      </p>

      <p>
        <strong>Resolution Gap:</strong>{" "}
        {neighborhood.gap ?? "N/A"}
      </p>

      <hr />

      <h3 style={{ color: "#111" }}>Citywide Reference</h3>

      <p>
        <strong>Reference Count:</strong>{" "}
        {neighborhood.reference_raw}
      </p>

      <p>
        <strong>Reference Value:</strong>{" "}
        {neighborhood.reference_value}
      </p>

      <p>
        <strong>Reference Rate:</strong>{" "}
        {neighborhood.reference_rate}
      </p>

      <hr />

      <h3 style={{ color: "#111" }}>Flags</h3>

      <p>
        <strong>Low Confidence:</strong>{" "}
        {neighborhood.low_confidence ? "Yes" : "No"}
      </p>

      <p>
        <strong>Per Capita Applicable:</strong>{" "}
        {neighborhood.per_capita_applicable ? "Yes" : "No"}
      </p>

      <p>
        <strong>Provisional:</strong>{" "}
        {neighborhood.provisional ? "Yes" : "No"}
      </p>
    </div>
  );
}