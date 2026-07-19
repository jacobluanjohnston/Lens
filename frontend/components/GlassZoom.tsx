"use client";

import { useMap } from "react-leaflet";

const SF_BOUNDS: [[number, number], [number, number]] = [
  [37.63, -122.52],
  [37.84, -122.35],
];

export default function GlassZoom() {
  const map = useMap();

  const buttonStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,.14)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,.22)",
    color: "#111827",
    fontSize: 24,
    fontWeight: 600,
    userSelect: "none",
    transition: "all .2s ease",
    boxShadow:
      "0 8px 24px rgba(15,23,42,.18), inset 0 1px 1px rgba(255,255,255,.25)",
  };

  return (
    <div
      className="glass-zoom-controls"
      style={{
        position: "absolute",
        left: 18,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ ...buttonStyle, borderRadius: 14 }} onClick={() => map.zoomIn(0.5)}>
        +
      </div>

      <div style={{ ...buttonStyle, borderRadius: 14 }} onClick={() => map.zoomOut(0.5)}>
        −
      </div>

      {/* Fit SF */}
      <div
        title="Reset to San Francisco"
        style={{
          ...buttonStyle,
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: "#475569",
        }}
        onClick={() => map.flyToBounds(SF_BOUNDS, { duration: 0.6 })}
      >
        SF
      </div>
    </div>
  );
}
