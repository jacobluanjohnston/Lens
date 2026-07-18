"use client";

import { useEffect, useState } from "react";
import type { Incident } from "@/types/incident";
import type { LensData } from "@/types/lens";
import type { CompareData } from "@/types/compare";
import { fetchCompareData } from "@/lib/api";

import Map from "@/components/Map";
import Controls from "@/components/Controls";
import LensPanel from "@/components/LensPanel";
import RankingsPanel from "@/components/RankingsPanel";
import NeighborhoodPanel from "@/components/NeighborhoodPanel";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();

function DeltaLegend({ maxMagnitude }: { maxMagnitude: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 18,
        bottom: 200,
        zIndex: 1000,
        width: 240,
        background: "rgba(255,255,255,.12)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 4px 12px rgba(0,0,0,.08), inset 0 1px 1px rgba(255,255,255,.18)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
        Change in police stops vs. crime reports
      </div>
      <div
        style={{
          height: 20,
          borderRadius: 4,
          background: "linear-gradient(to right, #2563eb, #93c5fd, #f1f5f9, #fca5a5, #dc2626)",
          marginBottom: 8,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <span>−{maxMagnitude.toFixed(1)}</span>
        <span>0</span>
        <span>+{maxMagnitude.toFixed(1)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "#64748b" }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: "#9ca3af" }} />
        <span>No comparable data</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [start, setStart] = useState("2018-01-01");
  const [end, setEnd] = useState(isoDate(today));
  const [category, setCategory] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [baselineStart, setBaselineStart] = useState("2024-04-01");
  const [baselineEnd, setBaselineEnd] = useState("2024-12-01");
  const [compareStart, setCompareStart] = useState("2025-01-01");
  const [compareEnd, setCompareEnd] = useState("2025-09-01");
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [compareFetchId, setCompareFetchId] = useState(0);

  const [activeLens, setActiveLens] = useState<1 | 2 | 3>(1);
  const [lens1Mode, setLens1Mode] = useState<"raw" | "per_capita">("per_capita");

  // Store only the ID so the selection survives lens switches.
  // The displayed data is derived from lensData after each fetch.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [lensData, setLensData] = useState<LensData[]>([]);
  const [fetchId, setFetchId] = useState(0);

  const [categories, setCategories] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compareValidationError =
    compareMode && (baselineEnd <= baselineStart || compareEnd <= compareStart)
      ? "Each comparison end month must be after its start month."
      : null;

  // Single selection ID shared across all modes — switching lenses or toggling
  // compare never clears or replaces the selected neighborhood.
  const selectedNeighborhood = selectedId
    ? (lensData.find((d) => d.neighborhood_id === selectedId) ?? null)
    : null;
  const selectedCompareNeighborhood = selectedId
    ? (compareData.find((item) => item.neighborhood_id === selectedId) ?? null)
    : null;
  const maxDeltaMagnitude = compareData.reduce(
    (maximum, item) => item.delta === null
      ? maximum
      : Math.max(maximum, Math.abs(item.delta)),
    0
  );

  // Shift end date to 3 months ago — outside the 90-day provisional window.
  function fixProvisional() {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    d.setDate(1);
    setEnd(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }

  function selectLens(lens: 1 | 2 | 3) {
    setCompareMode(false);
    setActiveLens(lens);
  }

  async function fetchLensData() {
    setLoading(true);
    setError(null);

    try {
      let url = `/lens/${activeLens}?start=${start}&end=${end}`;

      // Lens 1 supports category filtering
      if (activeLens === 1 && category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url);

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        // Ignore invalid or empty JSON responses.
      }

      if (!response.ok) {
        setLensData([]);

        if (typeof data?.detail === "string") {
          setError(data.detail);
        } else if (data?.detail?.msg) {
          setError(data.detail.msg);
        } else {
          setError(`Unable to load Lens ${activeLens}.`);
        }

        return;
      }

      if (!Array.isArray(data)) {
        setLensData([]);
        setError("Unexpected response from server.");
        return;
      }

      // Provisional: end date within 90 days of today — data may still be filing
      const endMs = new Date(end).getTime();
      const provisional = (Date.now() - endMs) / 86_400_000 < 90;

      setLensData(data.map((item: LensData) => ({ ...item, provisional })));
      setFetchId((n) => n + 1);
      setError(null);

    } catch (err) {
      setLensData([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to contact the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // Populate crime type dropdown once on mount
  useEffect(() => {
    fetch("/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data as string[]);
      })
      .catch(() => {});
  }, []);

  // Re-fetch whenever the active lens, date range, or category changes
  useEffect(() => {
    fetchLensData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLens, start, end, category]);

  useEffect(() => {
    if (!compareMode) return;

    if (baselineEnd <= baselineStart || compareEnd <= compareStart) {
      return;
    }

    let active = true;

    fetchCompareData(baselineStart, baselineEnd, compareStart, compareEnd)
      .then((data) => {
        if (!active) return;
        setCompareData(data);
        setCompareFetchId((current) => current + 1);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setCompareData([]);
        setError(reason instanceof Error ? reason.message : "Unable to load comparison.");
      });
    return () => {
      active = false;
    };
  }, [compareMode, baselineStart, baselineEnd, compareStart, compareEnd]);

  return (
    <main
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        background: "#f4f4f4",
      }}
    >
      {/* Map */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <Controls
          start={start}
          end={end}
          category={category}
          categories={categories}
          loading={loading}
          activeLens={activeLens}
          compareMode={compareMode}
          baselineStart={baselineStart}
          baselineEnd={baselineEnd}
          compareStart={compareStart}
          compareEnd={compareEnd}
          onStartChange={setStart}
          onEndChange={setEnd}
          onCategoryChange={setCategory}
          onCompareModeChange={setCompareMode}
          onBaselineStartChange={setBaselineStart}
          onBaselineEndChange={setBaselineEnd}
          onCompareStartChange={setCompareStart}
          onCompareEndChange={setCompareEnd}
        />

        <Map
          activeLens={activeLens}
          lens1Mode={lens1Mode}
          lensData={lensData}
          compareMode={compareMode}
          compareData={compareValidationError ? [] : compareData}
          fetchId={compareMode ? compareFetchId : fetchId}
          onSelectNeighborhood={(lens) => setSelectedId(lens?.neighborhood_id ?? null)}
          onSelectCompareNeighborhood={(comparison) =>
            setSelectedId(comparison?.neighborhood_id ?? null)
          }
        />

        {compareMode && !compareValidationError && (
          <DeltaLegend maxMagnitude={maxDeltaMagnitude} />
        )}
      </div>

      {/* Floating Right Panels */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 360,
          maxHeight: "calc(100vh - 40px)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <LensPanel
            activeLens={activeLens}
            onLensChange={selectLens}
            lens1Mode={lens1Mode}
            onLens1ModeChange={setLens1Mode}
          />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <NeighborhoodPanel
            neighborhood={selectedNeighborhood}
            compareMode={compareMode}
            compareNeighborhood={selectedCompareNeighborhood}
            compareRanges={{
              baselineStart,
              baselineEnd,
              compareStart,
              compareEnd,
            }}
            activeLens={activeLens}
            lens1Mode={lens1Mode}
            dateRange={{ start, end }}
            onFixProvisional={fixProvisional}
          />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <RankingsPanel
            compareMode={compareMode}
            activeLens={activeLens}
            lens1Mode={lens1Mode}
            lensData={lensData}
            compareData={compareData}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {(compareValidationError ?? error) && (
          <div
            style={{
              pointerEvents: "auto",
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
            }}
          >
            {compareValidationError ?? error}
          </div>
        )}
      </div>
    </main>
  );
}
