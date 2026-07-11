"use client";

import { useState } from "react";
import type { Incident } from "@/types/incident";

import Map from "@/components/Map";
import Controls from "@/components/Controls";
import LensPanel from "@/components/LensPanel";
import FlagsPanel from "@/components/FlagsPanel";

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

  const [categories, setCategories] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We'll reconnect these once the backend/database is ready.
  // useEffect(() => {
  //   fetch("/categories")
  //     .then((r) => r.json())
  //     .then(setCategories)
  //     .catch(() => {});
  //
  //   fetchIncidents(start, end, category)
  //     .then(setIncidents)
  //     .catch((err) =>
  //       setError(err instanceof Error ? err.message : "Failed to load")
  //     );
  // }, []);

  return (
    <main
      style={{
        display: "flex",
        height: "100vh",
        background: "#f4f4f4",
      }}
    >
      {/* Left Side */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
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
          onShow={() => {
            // Reconnect fetchIncidents() here once backend is ready.
          }}
        />

        <Map />
      </div>

      {/* Right Sidebar */}
      <div
        style={{
          width: "380px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 16,
          background: "#f8f9fa",
          borderLeft: "1px solid #d1d5db",
          overflowY: "auto",
        }}
      >
        <LensPanel />
        <FlagsPanel />
      </div>
    </main>
  );
}