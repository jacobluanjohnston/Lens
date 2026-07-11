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
        top: 16,
        left: 50,
        zIndex: 1000,

        background: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "8px 10px",

        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",

        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <label
        style={{
          color: "#111",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        From{" "}
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          style={{
            width: 140,
            padding: "5px 6px",
            color: "#111",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </label>

      <label
        style={{
          color: "#111",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        To{" "}
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          style={{
            width: 140,
            padding: "5px 6px",
            color: "#111",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </label>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{
          width: 155,
          padding: "5px 6px",
          color: "#111",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      >
        <option value="">All crime types</option>

        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        onClick={onShow}
        disabled={loading}
        style={{
          padding: "6px 12px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontWeight: 500,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Loading..." : "Show"}
      </button>
    </div>
  );
}