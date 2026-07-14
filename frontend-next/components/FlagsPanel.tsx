"use client";

export default function FlagsPanel() {
  const futureFlags = [
    "Enforcement Concentration",
    "Resolution Gap",
    "Data Quality",
  ];

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
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "#111827",
        }}
      >
        Analysis Flags
      </h2>

      <p
        style={{
          marginTop: 6,
          marginBottom: 20,
          color: "#4b5563",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Automated neighborhood insights will appear here after an analysis is
        generated.
      </p>

      {/* Status */}

      <div
        style={{
          padding: 16,

          borderRadius: 16,

          background: "rgba(255,255,255,.10)",

          border: "1px solid rgba(255,255,255,.16)",

          marginBottom: 22,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#0f766e",
            marginBottom: 6,
          }}
        >
          ✓ No Active Flags
        </div>

        <div
          style={{
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Run an analysis and select a neighborhood to surface potential
          anomalies and quality indicators.
        </div>
      </div>

      {/* Future */}

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#64748b",

            textTransform: "uppercase",
            letterSpacing: ".08em",

            marginBottom: 12,
          }}
        >
          Future Flag Types
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {futureFlags.map((flag) => (
            <div
              key={flag}
              style={{
                padding: "8px 12px",

                borderRadius: 999,

                background: "rgba(255,255,255,.12)",

                border:
                  "1px solid rgba(255,255,255,.18)",

                fontSize: 13,

                color: "#334155",

                fontWeight: 600,
              }}
            >
              {flag}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          lineHeight: 1.6,

          borderTop: "1px solid rgba(255,255,255,.18)",

          paddingTop: 18,
        }}
      >
        Flags highlight neighborhoods that may warrant additional review.
        They are indicators for further investigation—not conclusions.
      </div>
    </div>
  );
}