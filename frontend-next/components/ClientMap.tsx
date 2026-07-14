"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LensData } from "@/types/lens";
import GlassZoom from "./GlassZoom";

const SF_CENTER: [number, number] = [37.7749, -122.4194];

function getColor(value: number | null): string {
  if (value === null) return "#9ca3af";

  if (value >= 100) return "#08306b";
  if (value >= 20) return "#2171b5";
  if (value > 0) return "#6baed6";

  return "#c6dbef";
}

interface ClientMapProps {
  activeLens: 1 | 2 | 3;
  lensData: LensData[];
  onSelectNeighborhood: (lens: LensData | null) => void;
}

function getDisplayValue(
  lens: LensData | undefined,
  activeLens: 1 | 2 | 3
): number | null {
  if (!lens) return null;

  switch (activeLens) {
    case 1:
      return lens.raw_count;

    case 2:
      return lens.value;

    case 3:
      return lens.gap;

    default:
      return null;
  }
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
          data={neighborhoods}
          style={(feature) => {
            const neighborhoodId = feature!.properties.neighborhood_id;
            const lens = lensLookup.get(neighborhoodId);

            const displayValue = getDisplayValue(lens, activeLens);

            return {
              color: "#444",
              weight: 1,
              fillColor: getColor(displayValue),
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