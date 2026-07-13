"use client";

interface LensPanelProps {
  activeLens: 1 | 2 | 3;
  onLensChange: (lens: 1 | 2 | 3) => void;
}

export default function LensPanel({
  activeLens,
  onLensChange,
}: LensPanelProps) {
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

      {/* Lens 1 */}
      <div
        onClick={() => onLensChange(1)}
        style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: activeLens === 1 ? "#eff6ff" : "#fff",
          border:
            activeLens === 1
              ? "2px solid #2563eb"
              : "2px solid transparent",
        }}
      >
        <strong>🟢 Incidence</strong>
        <p style={{ margin: "4px 0", color: "#555" }}>
          View reported incidents by date, category, and location.
        </p>
        <small style={{ color: "#2e7d32" }}>
          Available in Sprint 1
        </small>
      </div>

      {/* Lens 2 */}
      <div
        onClick={() => onLensChange(2)}
        style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: activeLens === 2 ? "#eff6ff" : "#fff",
          border:
            activeLens === 2
              ? "2px solid #2563eb"
              : "2px solid transparent",
        }}
      >
        <strong>🟡 Officer-initiated Enforcement</strong>
        <p style={{ margin: "4px 0", color: "#555" }}>
          Compare officer-initiated activity with victim-reported serious crime.
        </p>
        <small style={{ color: "#888" }}>
          Coming in Sprint 2
        </small>
      </div>

      {/* Lens 3 */}
      <div
        onClick={() => onLensChange(3)}
        style={{
          padding: 12,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: activeLens === 3 ? "#eff6ff" : "#fff",
          border:
            activeLens === 3
              ? "2px solid #2563eb"
              : "2px solid transparent",
        }}
      >
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