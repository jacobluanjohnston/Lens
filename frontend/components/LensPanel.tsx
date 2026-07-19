"use client";

import { useState } from "react";

interface LensPanelProps {
  activeLens: 1 | 2 | 3;
  onLensChange: (lens: 1 | 2 | 3) => void;
  lens1Mode: "raw" | "per_capita";
  onLens1ModeChange: (mode: "raw" | "per_capita") => void;
}

const LENSES = [
  {
    id: 1 as const,
    color: "#f59e0b",
    icon: "◉",
    title: "Incidents",
    sub: "Reported incidents by neighborhood and category",
    disabled: false,
  },
  {
    id: 2 as const,
    color: "#6366f1",
    icon: "◉",
    title: "Police Stops vs. Crime Reports",
    sub: "How much police-initiated activity vs. crimes reported by residents",
    disabled: false,
  },
  {
    id: 3 as const,
    color: "#94a3b8",
    icon: "◎",
    title: "Resolution Gap",
    sub: "Clearance rate vs. citywide median — coming soon",
    disabled: true,
  },
] as const;

export default function LensPanel({ activeLens, onLensChange, lens1Mode, onLens1ModeChange }: LensPanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const activeLensTitle = LENSES.find((lens) => lens.id === activeLens)?.title ?? "Lens";

  const selectLens = (lens: 1 | 2 | 3) => {
    onLensChange(lens);
    setMobileExpanded(false);
  };

  return (
    <div
      className={`lens-panel${mobileExpanded ? " mobile-expanded" : ""}`}
      style={{
        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 16,
        padding: "10px 8px",
        boxShadow:
          "0 12px 40px rgba(15,23,42,.20), inset 0 1px 1px rgba(255,255,255,.25)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <button
        type="button"
        className="lens-panel-mobile-toggle"
        aria-expanded={mobileExpanded}
        aria-controls="lens-panel-options"
        onClick={() => setMobileExpanded((expanded) => !expanded)}
      >
        <span>
          View: {activeLensTitle}
          {activeLens === 1 && (
            <span style={{ fontWeight: 400, opacity: 0.7 }}>
              {" "}· {lens1Mode === "raw" ? "Total" : "Per Resident"}
            </span>
          )}
        </span>
        <span aria-hidden="true">{mobileExpanded ? "▲" : "▼"}</span>
      </button>

      <div id="lens-panel-options" className="lens-panel-options">
        {LENSES.map((lens) => {
          const active = activeLens === lens.id;

          return (
            <div key={lens.id}>
              <button
                onClick={() => !lens.disabled && selectLens(lens.id)}
                disabled={lens.disabled}
                style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                border: active
                  ? "1px solid rgba(255,255,255,.30)"
                  : "1px solid transparent",
                background: active
                  ? "rgba(255,255,255,.22)"
                  : "transparent",
                cursor: lens.disabled ? "default" : "pointer",
                textAlign: "left",
                opacity: lens.disabled ? 0.45 : 1,
                transition: "background .18s, border .18s",
                width: "100%",
                }}
              >
              {/* Colored icon */}
              <span
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  color: lens.color,
                  marginTop: 1,
                  flexShrink: 0,
                  filter: active
                    ? "drop-shadow(0 0 4px " + lens.color + "88)"
                    : "none",
                  transition: "filter .18s",
                }}
              >
                {lens.icon}
              </span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 600,
                    color: active ? "#111827" : "#374151",
                    lineHeight: 1.2,
                    marginBottom: 2,
                  }}
                >
                  {lens.title}
                  {active && (
                    <span
                      style={{
                        marginLeft: 7,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                        color: "#6366f1",
                        verticalAlign: "middle",
                      }}
                    >
                      active
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    lineHeight: 1.3,
                  }}
                >
                  {lens.sub}
                </div>
              </div>
              </button>

            {/* Lens 1 sub-toggle: Total vs Per Capita */}
            {active && lens.id === 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  margin: "4px 12px 6px 40px",
                  padding: 3,
                  borderRadius: 10,
                  background: "rgba(0,0,0,.07)",
                }}
              >
                {(["raw", "per_capita"] as const).map((mode) => {
                  const selected = lens1Mode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => onLens1ModeChange(mode)}
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        fontSize: 11,
                        fontWeight: selected ? 600 : 400,
                        color: selected ? "#111827" : "#9ca3af",
                        background: selected ? "rgba(255,255,255,.88)" : "transparent",
                        border: "none",
                        borderRadius: 7,
                        cursor: "pointer",
                        boxShadow: selected ? "0 1px 3px rgba(0,0,0,.10)" : "none",
                        transition: "all .15s",
                      }}
                    >
                      {mode === "raw" ? "Total" : "Per Resident"}
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
