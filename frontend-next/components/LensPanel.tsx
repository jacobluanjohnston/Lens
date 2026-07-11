"use client";

export default function LensPanel() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        color: "#222",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Lenses</h2>

      <p style={{ color: "#666", marginBottom: 20 }}>
        Select a perspective for analyzing police incident data.
      </p>

      <div style={{ marginBottom: 16 }}>
        <strong>🟢 Incidence</strong>
        <p style={{ margin: "4px 0", color: "#555" }}>
          View reported incidents by date, category, and location.
        </p>
        <small style={{ color: "#2e7d32" }}>
          Available in Sprint 1
        </small>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>🟡 Officer-initiated Enforcement</strong>
        <p style={{ margin: "4px 0", color: "#555" }}>
          Compare officer-initiated activity with victim-reported serious crime.
        </p>
        <small style={{ color: "#888" }}>
          Coming in Sprint 2
        </small>
      </div>

      <div>
        <strong>🔵 Resolution</strong>
        <p style={{ margin: "4px 0", color: "#555" }}>
          Compare neighborhood clearance rates with the citywide average.
        </p>
        <small style={{ color: "#888" }}>
          Coming in Sprint 2
        </small>
      </div>
    </div>
  );
}