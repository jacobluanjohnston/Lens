import { MapContainer, TileLayer } from 'react-leaflet'

const SF_CENTER: [number, number] = [37.7749, -122.4194]

export default function App() {
  return (
    <MapContainer center={SF_CENTER} zoom={12} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}

// https://react-leaflet.js.org/docs/api-components