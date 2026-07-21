"use client";

import { useEffect, useState } from "react";
import { MAX_REPORT_YEAR } from "@/lib/generateReport";

// MIN_YEAR matches the SF current dataset which starts in 2018.
const MIN_YEAR = 2018;

export interface ReportConfig {
  startYear: number;
  endYear: number;
}

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: ReportConfig) => void;
}

export default function GenerateReportModal({
  open,
  onClose,
  onConfirm,
}: GenerateReportModalProps) {
  const [startYear, setStartYear] = useState(2021);
  const [endYear, setEndYear] = useState(2025);
  const [error, setError] = useState<string | null>(null);

  // Reset defaults each time the modal opens
  useEffect(() => {
    if (!open) return;
    setStartYear(2021);
    setEndYear(2025);
    setError(null);
  }, [open]);

  const rightCensored = endYear >= MAX_REPORT_YEAR;

  if (!open) return null;

  function handleConfirm() {
    if (startYear >= endYear) {
      setError("End year must be after start year.");
      return;
    }
    setError(null);
    onConfirm({ startYear, endYear });
  }

  const years = Array.from(
    { length: MAX_REPORT_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );

  const fieldStyle: React.CSSProperties = {
    padding: "6px 8px",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.28)",
    background: "rgba(255,255,255,.22)",
    color: "#111827",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 4,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-report-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        // Light wash only — no heavy gray sheet over the controls bar
        background: "rgba(15, 23, 42, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,.72)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: 22,
          padding: 24,
          border: "1px solid rgba(255,255,255,.45)",
          boxShadow:
            "0 12px 40px rgba(15,23,42,.22), inset 0 1px 1px rgba(255,255,255,.35)",
          color: "#111827",
          flexShrink: 0,
        }}
      >
        <h2
          id="generate-report-title"
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#111827",
            textAlign: "center",
          }}
        >
          Generate Report
        </h2>
        <p
          style={{
            margin: "8px 0 20px",
            fontSize: 13,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Year-over-year compare for the same month range across years.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Start year</div>
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              style={{ ...fieldStyle, width: "100%" }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>End year</div>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              style={{ ...fieldStyle, width: "100%" }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b" }}>
          Repeats the selected event window dates for every year in the range.
        </p>

        {rightCensored && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#b45309" }}>
            Data flag: end year {endYear} includes recent months that may be
            incomplete due to reporting lag. The {endYear - 1}-{endYear} comparison
            should be treated as provisional.
          </p>
        )}

        {error && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#dc2626" }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              ...buttonStyle,
              border: "1px solid rgba(15,23,42,.12)",
              background: "rgba(255,255,255,.6)",
              color: "#111827",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              ...buttonStyle,
              border: "1px solid rgba(99,102,241,.45)",
              background: "rgba(99,102,241,.14)",
              color: "#4338ca",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}