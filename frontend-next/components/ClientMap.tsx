"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SF_CENTER: [number, number] = [37.7749, -122.4194];

export default function ClientMap() {
  return (
    <MapContainer
      center={SF_CENTER}
      zoom={12}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}