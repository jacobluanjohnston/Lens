"use client";

export default function FlagsPanel() {
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
      <h2 style={{ marginTop: 0 }}>Flags</h2>

      <p style={{ color: "#666" }}>
        No analysis has been generated yet.
      </p>

      <hr style={{ margin: "16px 0" }} />

      <strong>Future flag types</strong>

      <ul style={{ color: "#555", paddingLeft: 18 }}>
        <li>Enforcement concentration</li>
        <li>Resolution gap</li>
        <li>Data quality</li>
      </ul>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "#888",
        }}
      >
        Flags identify neighborhoods that may warrant additional
        investigation. They are not conclusions.
      </p>
    </div>
  );
}