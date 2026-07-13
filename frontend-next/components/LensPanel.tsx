"use client";

interface LensPanelProps {
  activeLens: 1 | 2 | 3;
  onLensChange: (lens: 1 | 2 | 3) => void;
}

export default function LensPanel({
  activeLens,
  onLensChange,
}: LensPanelProps) {
  const lenses = [
    {
      id: 1 as const,
      color: "#22c55e",
      title: "Incidence",
      description:
        "View reported incidents by neighborhood, category, and date.",
      status: "Available",
    },
    {
      id: 2 as const,
      color: "#f59e0b",
      title: "Officer Enforcement",
      description:
        "Compare officer-initiated activity against reported serious crime.",
      status: "Sprint 2",
    },
    {
      id: 3 as const,
      color: "#3b82f6",
      title: "Resolution",
      description:
        "Compare neighborhood resolution performance across the city.",
      status: "Sprint 2",
    },
  ];

  return (
    <div
      style={{
        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 20,
        padding: 20,
        color: "#111827",
        boxShadow:
          "0 12px 40px rgba(15,23,42,.20), inset 0 1px 1px rgba(255,255,255,.25)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        Lenses
      </h2>

      <p
        style={{
          marginTop: 6,
          marginBottom: 18,
          color: "#4b5563",
          lineHeight: 1.5,
          fontSize: 14,
        }}
      >
        Choose an analytical perspective to explore police activity throughout
        San Francisco.
      </p>

      {lenses.map((lens) => {
        const active = activeLens === lens.id;

        return (
          <button
            key={lens.id}
            onClick={() => onLensChange(lens.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "stretch",
              gap: 12,

              textAlign: "left",
              cursor: "pointer",

              padding: "14px 16px",
              marginBottom: 10,

              borderRadius: 14,

              background: active
                ? "rgba(255,255,255,.28)"
                : "rgba(255,255,255,.08)",

              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",

              border: active
                ? "1px solid rgba(59,130,246,.45)"
                : "1px solid rgba(255,255,255,.16)",

              boxShadow: active
                ? "0 8px 22px rgba(37,99,235,.15)"
                : "0 4px 12px rgba(0,0,0,.05)",

              transform: active ? "translateY(-2px)" : "translateY(0)",

              transition:
                "all .25s cubic-bezier(.22,.61,.36,1)",

              overflow: "hidden",
            }}
          >
            {/* Accent Bar */}
            <div
              style={{
                width: 4,
                borderRadius: 999,
                background: lens.color,
                opacity: active ? 1 : 0.8,
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#111827",
                  }}
                >
                  {lens.title}
                </span>

                {active && (
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 999,

                      background: "rgba(37,99,235,.14)",

                      border:
                        "1px solid rgba(37,99,235,.25)",

                      color: "#1d4ed8",

                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              <div
                style={{
                  color: "#4b5563",
                  fontSize: 13,
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                {lens.description}
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "4px 9px",
                  borderRadius: 999,

                  fontSize: 11,
                  fontWeight: 600,

                  background:
                    lens.status === "Available"
                      ? "rgba(34,197,94,.14)"
                      : "rgba(148,163,184,.16)",

                  color:
                    lens.status === "Available"
                      ? "#15803d"
                      : "#475569",
                }}
              >
                {lens.status}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}