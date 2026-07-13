"use client";

import { useMap } from "react-leaflet";

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
      style={{
        position: "absolute",
        top: 20,
        right: 20,

        zIndex: 1000,

        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          ...buttonStyle,
          borderRadius: 14,
        }}
        onClick={() => map.zoomIn()}
      >
        +
      </div>

      <div
        style={{
          ...buttonStyle,
          borderRadius: 14,
        }}
        onClick={() => map.zoomOut()}
      >
        −
      </div>
    </div>
  );
}