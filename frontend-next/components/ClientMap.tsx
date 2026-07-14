"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LensData } from "@/types/lens";
import GlassZoom from "./GlassZoom";

const SF_CENTER: [number, number] = [37.7749, -122.4194];

// Colors are ratio-based (value / citywide median) so the scale is always
// relative, never an absolute verdict about a neighborhood.
function getColor(lens: LensData | undefined, activeLens: 1 | 2 | 3): string {
  if (!lens) return "#9ca3af";

  if (activeLens === 1) {
    const v = lens.raw_count;
    const ref = lens.reference_raw;
    if (v == null || !ref) return "#9ca3af";
    const r = v / ref;
    if (r >= 3)   return "#800026";
    if (r >= 2)   return "#E31A1C";
    if (r >= 1.5) return "#FC4E2A";
    if (r >= 1.0) return "#FEB24C";
    if (r >= 0.5) return "#FED976";
    return "#FFEDA0";
  }

  if (activeLens === 2) {
    const v = lens.value;
    const ref = lens.reference_value;
    if (v == null || !ref) return "#9ca3af";
    const r = v / ref;
    // Diverging blue–neutral–orange: high ratio = more proactive enforcement
    if (r >= 2)   return "#c2410c";
    if (r >= 1.5) return "#f97316";
    if (r >= 1.1) return "#fdba74";
    if (r >= 0.9) return "#e2e8f0";
    if (r >= 0.5) return "#93c5fd";
    return "#1d4ed8";
  }

  return "#9ca3af"; // Lens 3 not yet available
}

interface ClientMapProps {
  activeLens: 1 | 2 | 3;
  lensData: LensData[];
  onSelectNeighborhood: (lens: LensData | null) => void;
}


export default function ClientMap({
  activeLens,
  lensData,
  onSelectNeighborhood,
}: ClientMapProps) {
  const [neighborhoods, setNeighborhoods] = useState<any>(null);

  const lensLookup = new Map(
    lensData.map((item) => [item.neighborhood_id, item])
  );

  useEffect(() => {
    fetch("/neighborhoods")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load neighborhoods");
        }
        return res.json();
      })
      .then(setNeighborhoods)
      .catch(console.error);
  }, []);

  return (
    <MapContainer
      center={SF_CENTER}
      zoom={12}
      zoomControl={false}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GlassZoom />

      {neighborhoods && (
        <GeoJSON
          key={`lens-${activeLens}-${lensData.length}`}
          data={neighborhoods}
          style={(feature) => {
            const neighborhoodId = feature!.properties.neighborhood_id;
            const lens = lensLookup.get(neighborhoodId);

            return {
              color: "#444",
              weight: 1,
              fillColor: getColor(lens, activeLens),
              fillOpacity: 0.85,
            };
          }}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: () => {
                const neighborhoodId = feature.properties.neighborhood_id;
                const lens = lensLookup.get(neighborhoodId);

                onSelectNeighborhood(lens ?? null);
              },
            });
          }}
        />
      )}
    </MapContainer>
  );
}