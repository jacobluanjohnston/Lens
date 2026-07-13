"use client";

interface ControlsProps {
  start: string;
  end: string;
  category: string;
  categories: string[];

  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShow: () => void;

  loading: boolean;
}

export default function Controls({
  start,
  end,
  category,
  categories,
  onStartChange,
  onEndChange,
  onCategoryChange,
  onShow,
  loading,
}: ControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 18,
        left: 18,
        zIndex: 1000,

        display: "flex",
        alignItems: "center",
        gap: 14,

        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",

        border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 18,

        padding: "12px 16px",

        boxShadow:
          "0 12px 40px rgba(15,23,42,.20), inset 0 1px 1px rgba(255,255,255,.25)",
      }}
    >
      {/* Logo */}

      <div
        style={{
          marginRight: 6,
          minWidth: 70,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          LENS
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#64748b",
            marginTop: 2,
          }}
        >
          Police Analytics
        </div>
      </div>

      {/* From */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <label
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          From
        </label>

        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          style={{
            width: 118,
            padding: "6px 8px",

            fontSize: 12,

            borderRadius: 8,

            border: "1px solid rgba(255,255,255,.18)",

            background: "rgba(255,255,255,.18)",

            color: "#111827",
          }}
        />
      </div>

      {/* To */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <label
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          To
        </label>

        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          style={{
            width: 118,
            padding: "6px 8px",

            fontSize: 12,

            borderRadius: 8,

            border: "1px solid rgba(255,255,255,.18)",

            background: "rgba(255,255,255,.18)",

            color: "#111827",
          }}
        />
      </div>

      {/* Crime */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <label
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Crime
        </label>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            width: 145,
            padding: "6px 8px",

            fontSize: 12,

            borderRadius: 8,

            border: "1px solid rgba(255,255,255,.18)",

            background: "rgba(255,255,255,.18)",

            color: "#111827",
          }}
        >
          <option value="">All Crimes</option>

          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Analyze */}

      <button
        onClick={onShow}
        disabled={loading}
        style={{
          marginTop: 15,

          padding: "7px 14px",

          borderRadius: 8,

          border: "none",

          background: "linear-gradient(135deg,#2563eb,#1d4ed8)",

          color: "#fff",

          fontWeight: 700,

          fontSize: 12,

          cursor: loading ? "default" : "pointer",

          boxShadow:
            "0 5px 14px rgba(37,99,235,.28)",
        }}
      >
        {loading ? "Loading..." : "Analyze"}
      </button>
    </div>
  );
}