"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mockLensData } from "@/lib/mockApi";
import type { LensData } from "@/types/lens";
import GlassZoom from "./GlassZoom";

const SF_CENTER: [number, number] = [37.7749, -122.4194];

function getNeighborhoodId(feature: any): string {
  return (
    feature.properties.neighborhood_id ??
    feature.properties.name
      .toLowerCase()
      .replace(/[.'"]/g, "")
      .replace(/\//g, "-")
      .replace(/\s+/g, "-")
  );
}

function getColor(value: number | null): string {
  if (value === null) return "#9ca3af";

  if (value >= 100) return "#08306b";
  if (value >= 20) return "#2171b5";
  if (value > 0) return "#6baed6";

  return "#c6dbef";
}

interface ClientMapProps {
  activeLens: 1 | 2 | 3;
  // selectedNeighborhood: LensData | null;
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
  // selectedNeighborhood,
  onSelectNeighborhood,
}: ClientMapProps) {
  const [neighborhoods, setNeighborhoods] = useState<any>(null);

  const lensData = mockLensData;

  const lensLookup = new Map(
    lensData.map((item) => [item.neighborhood_id, item])
  );

  useEffect(() => {
    fetch("/data/sf-neighborhoods.geojson")
      .then((res) => res.json())
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
            const neighborhoodId = getNeighborhoodId(feature!);
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
                const neighborhoodId = getNeighborhoodId(feature);
                const lens = lensLookup.get(neighborhoodId);

                if (lens) {
                  onSelectNeighborhood(lens);
                }
              },
            });
          }}
        />
      )}
    </MapContainer>
  );
}