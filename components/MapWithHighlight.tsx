import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Feature, GeoJSON as GeoJSONType, Geometry } from 'geojson'
import type { PathOptions } from 'leaflet'
import Papa from 'papaparse'

const enum Column {
  PotableWater = 1,
  DemocracyIndex = 2,
  Smartraveller = 3,
  CostOfLiving = 4,
  HDI = 5,
  Crime = 6,
  Corruption = 7
}

export default function MapWithHighlight() {
const [geoData, setGeoData] = useState<GeoJSONType | null>(null)
  const [highlightCountries, setHighlightCountries] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)
const [democracyIndex, setDemocracyIndex] = useState<number | null>(null)
const [costOfLiving, setCostOfLiving] = useState<number | null>(null)
const [hdi, setHDI] = useState<number | null>(null)
const [crime, setCrime] = useState<number | null>(null)
const [corruption, setCorruption] = useState<number | null>(null)

  const [showPotableWater, setShowPotableWater] = useState(false)
const [showDemocracyIndex, setShowDemocracyIndex] = useState(false)
const [showCostOfLiving, setShowCostOfLiving] = useState(false)
const [showHDI, setShowHDI] = useState(false)
const [showCrime, setShowCrime] = useState(false)
const [showCorruption, setShowCorruption] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Load GeoJSON
    fetch('/data/countries.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(console.error)
  }, [])

  const geoStyle = (feature): PathOptions => {
    const countryName = feature.properties?.name || ''
    const isHighlighted = highlightCountries.has(countryName)
    return {
      fillColor: isHighlighted ? 'green' : 'transparent',
      weight: 2,
      color: isHighlighted ? 'darkgreen' : 'black',
      fillOpacity: isHighlighted ? 0.7 : 0,
    }
  }

useEffect(() => {
  const filters: ((row: any[]) => boolean)[] = []

  if (showPotableWater) {
    filters.push(row => row[Column.PotableWater]?.toLowerCase() === 'true')
  }

  if (showDemocracyIndex && democracyIndex !== null) {
    filters.push(row => parseFloat(row[Column.DemocracyIndex]) > democracyIndex)
  }

  if (showCostOfLiving && costOfLiving !== null) {
    filters.push(row => parseFloat(row[Column.CostOfLiving]) < costOfLiving)
  }

  if (showHDI && hdi !== null) {
    filters.push(row => parseFloat(row[Column.HDI]) > hdi)
  }

  if (showCrime && crime !== null) {
    filters.push(row => parseFloat(row[Column.Crime]) < crime)
  }

  if (showCorruption && corruption !== null) {
    filters.push(row => parseFloat(row[Column.Corruption]) > corruption)
  }

  if (filters.length === 0) {
    setHighlightCountries(new Set())
    return
  }

  highlightMatchingCountries(filters).then(setHighlightCountries)
}, [
  showPotableWater,
  showDemocracyIndex,
  showCostOfLiving,
  showHDI,
  showCrime,
  showCorruption,
  democracyIndex,
  costOfLiving,
  hdi,
  crime,
  corruption
])

async function highlightMatchingCountries(filters: ((row: any[]) => boolean)[]): Promise<Set<string>> {
  try {
    const res = await fetch('/data/values.csv')
    const csvText = await res.text()
    const results = Papa.parse<any[]>(csvText, { header: false })


    const countriesToHighlight = new Set<string>()

    results.data.forEach((row: any[]) => {
      if (filters.every(f => f(row))) {
        countriesToHighlight.add(row[0].toString())
      }
    })

    return countriesToHighlight
  } catch (error) {
    console.error(error)
    return new Set()
  }
}



  if (!isClient) {
    return <div>Loading map...</div>
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%'}}>
      {/* Filter box */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontFamily: 'sans-serif',
          color: 'black'
        }}
      >
        FILTERS
        <br />
  <label>
          <input
            type="checkbox"
            checked={showPotableWater}
            onChange={e => setShowPotableWater(e.target.checked)}
          />{' '}
          Potable Water
        </label>
  <br />
  <label>
    <input type="checkbox" checked={showDemocracyIndex} onChange={e => setShowDemocracyIndex(e.target.checked)} />
    {' '}Democracy Index &gt;
    <input
      type="number"
      min={0}
      step={0.2}
      value={democracyIndex ?? ''}
      onChange={e => setDemocracyIndex(parseFloat(e.target.value) || null)}
    />
  </label>
  <br />
  <label>
    <input type="checkbox" checked={showCostOfLiving} onChange={e => setShowCostOfLiving(e.target.checked)} />
    {' '}Cost of Living &lt;
    <input
      type="number"
      min={0}
      max={120}
      value={costOfLiving ?? ''}
      onChange={e => setCostOfLiving(parseFloat(e.target.value) || null)}
    />
  </label>
  <br />
  <label>
    <input type="checkbox" checked={showHDI} onChange={e => setShowHDI(e.target.checked)} />
    {' '}HDI &gt;
    <input
      type="number"
      min={0}
      max={1}
      step={0.01}
      value={hdi ?? ''}
      onChange={e => setHDI(parseFloat(e.target.value) || null)}
    />
  </label>
  <br />
  <label>
    <input type="checkbox" checked={showCrime} onChange={e => setShowCrime(e.target.checked)} />
    {' '}Crime &lt;
    <input
      type="number"
      min={0}
      max={99}
      value={crime ?? ''}
      onChange={e => setCrime(parseFloat(e.target.value) || null)}
    />
  </label>
  <br />
  <label>
    <input type="checkbox" checked={showCorruption} onChange={e => setShowCorruption(e.target.checked)} />
    {' '}Corruption &gt;
    <input
      type="number"
      min={0}
      max={99}
      value={corruption ?? ''}
      onChange={e => setCorruption(parseFloat(e.target.value) || null)}
    />
  </label>
</div>

      {/* Map */}
      <MapContainer
        style={{ height: '100%', width: '100%' }}
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && <GeoJSON data={geoData} style={geoStyle} />}
      </MapContainer>
    </div>
  )
}