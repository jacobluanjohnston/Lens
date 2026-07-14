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

  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<LensData | null>(null);

  const [lensData, setLensData] = useState<LensData[]>([]);

  const [categories, setCategories] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      console.log("fetch url:", url);
      console.log("status:", response.status);

      const text = await response.text();
      console.log("response:", text);

      const data = JSON.parse(text);

      console.log("parsed:", data);

      setLensData(data);

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to load lens data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLensData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLens]);

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
          onStartChange={setStart}
          onEndChange={setEnd}
          onCategoryChange={setCategory}
          onShow={fetchLensData}
        />

        <Map
          activeLens={activeLens}
          lensData={lensData}
          onSelectNeighborhood={setSelectedNeighborhood}
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
          />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <FlagsPanel />
        </div>
      </div>
    </main>
  );
}