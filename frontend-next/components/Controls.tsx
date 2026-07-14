"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MIN_YEAR = 2018;
const MAX_YEAR = new Date().getFullYear();

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: ".08em",
};

const TRIGGER_STYLE: React.CSSProperties = {
  width: 112,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.28)",
  background: "rgba(255,255,255,.22)",
  color: "#111827",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 4,
};

interface MonthPickerProps {
  label: string;
  value: string;        // "YYYY-MM-DD"
  disabled: boolean;
  onChange: (value: string) => void;
}

function MonthPicker({ label, value, disabled, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const year  = parseInt(value.slice(0, 4));
  const month = parseInt(value.slice(5, 7));     // 1-based

  const [viewYear, setViewYear] = useState(year || MAX_YEAR);

  // Sync viewYear when value changes externally
  useEffect(() => {
    if (year) setViewYear(year);
  }, [year]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function select(m: number) {
    onChange(`${viewYear}-${String(m).padStart(2, "0")}-01`);
    setOpen(false);
  }

  const displayText = year && month
    ? `${MONTHS[month - 1]} ${year}`
    : "Select…";

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 3, position: "relative" }}>
      <label style={LABEL_STYLE}>{label}</label>

      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          ...TRIGGER_STYLE,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span>{displayText}</span>
        <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 2000,
            width: 200,
            background: "rgba(255,255,255,.82)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,.45)",
            borderRadius: 14,
            boxShadow: "0 16px 48px rgba(15,23,42,.22), inset 0 1px 1px rgba(255,255,255,.6)",
            padding: 12,
            userSelect: "none",
          }}
        >
          {/* Year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => setViewYear((y) => Math.max(MIN_YEAR, y - 1))}
              disabled={viewYear <= MIN_YEAR}
              style={{
                background: "none",
                border: "none",
                cursor: viewYear <= MIN_YEAR ? "default" : "pointer",
                fontSize: 16,
                color: viewYear <= MIN_YEAR ? "#cbd5e1" : "#374151",
                padding: "2px 6px",
                borderRadius: 6,
              }}
            >
              ‹
            </button>

            <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
              {viewYear}
            </span>

            <button
              onClick={() => setViewYear((y) => Math.min(MAX_YEAR, y + 1))}
              disabled={viewYear >= MAX_YEAR}
              style={{
                background: "none",
                border: "none",
                cursor: viewYear >= MAX_YEAR ? "default" : "pointer",
                fontSize: 16,
                color: viewYear >= MAX_YEAR ? "#cbd5e1" : "#374151",
                padding: "2px 6px",
                borderRadius: 6,
              }}
            >
              ›
            </button>
          </div>

          {/* Month grid — 4 columns × 3 rows */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const isSelected = viewYear === year && m === month;
              return (
                <button
                  key={name}
                  onClick={() => select(m)}
                  style={{
                    padding: "6px 0",
                    borderRadius: 8,
                    border: isSelected
                      ? "1px solid rgba(99,102,241,.45)"
                      : "1px solid transparent",
                    background: isSelected
                      ? "rgba(99,102,241,.14)"
                      : "transparent",
                    color: isSelected ? "#4338ca" : "#374151",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(99,102,241,.07)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface ControlsProps {
  start: string;
  end: string;
  category: string;
  categories: string[];
  loading: boolean;
  activeLens: 1 | 2 | 3;

  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function Controls({
  start,
  end,
  category,
  categories,
  loading,
  activeLens,
  onStartChange,
  onEndChange,
  onCategoryChange,
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
      <div style={{ marginRight: 6, minWidth: 70 }}>
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
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
          Police Analytics
        </div>
      </div>

      <MonthPicker
        label="From"
        value={start}
        disabled={loading}
        onChange={onStartChange}
      />

      <MonthPicker
        label="To"
        value={end}
        disabled={loading}
        onChange={onEndChange}
      />

      {/* Crime — hidden on Lens 2 (hardcodes its own category buckets) */}
      {activeLens !== 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={LABEL_STYLE}>Crime</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={loading}
            style={{
              width: 145,
              padding: "6px 8px",
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.28)",
              background: "rgba(255,255,255,.22)",
              color: "#111827",
              cursor: "pointer",
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
      )}
    </div>
  );
}
