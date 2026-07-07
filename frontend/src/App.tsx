import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'

const SF_CENTER: [number, number] = [37.7749, -122.4194]

interface Incident {
  lat: number
  lon: number
  category: string | null
  occurred_at: string
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(today.getDate() - 30)

export default function App() {
  const [start, setStart]       = useState(isoDate(thirtyDaysAgo))
  const [end, setEnd]           = useState(isoDate(today))
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [incidents, setIncidents]   = useState<Incident[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function fetchIncidents(s: string, e: string, cat: string) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ start: s, end: e })
      if (cat) params.set('category', cat)
      const res = await fetch(`/incidents?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      setIncidents(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
    fetchIncidents(start, end, category)
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh' }}>

      {/* ── Controls ── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: 'white', borderRadius: 8,
        padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <label style={{ fontSize: 14 }}>
          From&nbsp;
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label style={{ fontSize: 14 }}>
          To&nbsp;
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ fontSize: 14 }}
        >
          <option value=''>All crime types</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => fetchIncidents(start, end, category)}
          disabled={loading}
          style={{ padding: '4px 12px', cursor: loading ? 'default' : 'pointer' }}
        >
          {loading ? 'Loading…' : 'Show'}
        </button>
        {!loading && incidents.length > 0 && (
          <span style={{ fontSize: 13, color: '#555' }}>
            {incidents.length.toLocaleString()} incidents
            {incidents.length === 20000 ? ' (cap — narrow the range)' : ''}
          </span>
        )}
        {error && <span style={{ fontSize: 13, color: '#c00' }}>{error}</span>}
      </div>

      {/* ── Map ── */}
      <MapContainer center={SF_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidents.map((inc, i) => (
          <CircleMarker
            key={i}
            center={[inc.lat, inc.lon]}
            radius={3}
            pathOptions={{ color: '#e63946', fillColor: '#e63946', fillOpacity: 0.55, weight: 0 }}
          />
        ))}
      </MapContainer>

    </div>
  )
}
