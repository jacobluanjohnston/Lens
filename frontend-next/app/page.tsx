"use client";

import { useEffect, useState } from "react";
import type { Incident } from "@/types/incident";
import type { LensData } from "@/types/lens";

import Map from "@/components/Map";
import Controls from "@/components/Controls";
import LensPanel from "@/components/LensPanel";
import FlagsPanel from "@/components/FlagsPanel";
import NeighborhoodPanel from "@/components/NeighborhoodPanel";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

export default function Home() {
  const [start, setStart] = useState(isoDate(thirtyDaysAgo));
  const [end, setEnd] = useState(isoDate(today));
  const [category, setCategory] = useState("");

  const [activeLens, setActiveLens] = useState<1 | 2 | 3>(1);

  // Store only the ID so the selection survives lens switches.
  // The displayed data is derived from lensData after each fetch.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [lensData, setLensData] = useState<LensData[]>([]);
  const [fetchId, setFetchId] = useState(0);

  const [categories, setCategories] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive the panel data from current lensData whenever either changes.
  const selectedNeighborhood = selectedId
    ? (lensData.find((d) => d.neighborhood_id === selectedId) ?? null)
    : null;

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
          onStartChange={setStart}
          onEndChange={setEnd}
          onCategoryChange={setCategory}
        />

        <Map
          activeLens={activeLens}
          lensData={lensData}
          fetchId={fetchId}
          onSelectNeighborhood={(lens) => setSelectedId(lens?.neighborhood_id ?? null)}
        />
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
          paddingRight: 4,
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <LensPanel
            activeLens={activeLens}
            onLensChange={setActiveLens}
          />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <NeighborhoodPanel
            neighborhood={selectedNeighborhood}
            activeLens={activeLens}
            dateRange={{ start, end }}
          />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <FlagsPanel />
        </div>

        {error && (
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
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
