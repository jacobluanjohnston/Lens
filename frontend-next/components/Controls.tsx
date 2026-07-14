"use client";

interface ControlsProps {
  start: string;
  end: string;
  category: string;
  categories: string[];

  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onCategoryChange: (value: string) => void;

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

      {/* From Month */}

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
          type="month"
          value={start.slice(0, 7)}
          onChange={(e) => onStartChange(`${e.target.value}-01`)}
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

      {/* To Month */}

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
          type="month"
          value={end.slice(0, 7)}
          onChange={(e) => onEndChange(`${e.target.value}-01`)}
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
          disabled={loading}
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
    </div>
  );
}