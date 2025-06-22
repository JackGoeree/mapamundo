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
  Corruption = 6
}

export default function MapWithHighlight() {
const [geoData, setGeoData] = useState<GeoJSONType | null>(null)
  const [highlightCountries, setHighlightCountries] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)
  const [showPotableWater, setShowPotableWater] = useState(false)
  const [democracyIndex, setShowDemocracyIndex] = useState<number | ''>('') 
  const [costOfLiving, setShowCostOfLiving] = useState<number | ''>('')
  const [hdi, setShowHdi] = useState<number | ''>('') 
  const [corruption, setShowCorruption] = useState<number | ''>('') 

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
      fillColor: isHighlighted ? 'red' : 'transparent',
      weight: 2,
      color: isHighlighted ? 'darkred' : 'black',
      fillOpacity: isHighlighted ? 0.7 : 0,
    }
  }

  function highlightMatchingCountries(filter: number, expression: (val: string) => boolean) {
    fetch('/data/values.csv')
        .then(res => res.text())
        .then(csvText => {
          const results = Papa.parse(csvText, { header: false })
          const countriesToHighlight = new Set<string>()
          results.data.forEach((row: any) => {
            if (row[filter] && expression(row[filter])) {
              countriesToHighlight.add(row[0].toString())
            }
          })
          setHighlightCountries(countriesToHighlight)
        })
        .catch(console.error)
  }

  // Potable water
  useEffect(() => {
    if (showPotableWater) {
      // Fetch and parse CSV ONLY when checkbox is checked
      highlightMatchingCountries(Column.PotableWater, val => val.toLowerCase() === 'true')
    } else {
      // Clear highlights when unchecked
      setHighlightCountries(new Set())
    }
  }, [showPotableWater])

  // Democracy Index
  useEffect(() => {
    highlightMatchingCountries(Column.DemocracyIndex, val => parseFloat(val) > (democracyIndex as number))
  }, [democracyIndex])

  // Cost of Living
  useEffect(() => {
    highlightMatchingCountries(Column.CostOfLiving, val => parseFloat(val) < (costOfLiving as number))
  }, [costOfLiving])

  // HDI
  useEffect(() => {
    highlightMatchingCountries(Column.HDI, val => parseFloat(val) > (hdi as number))
  }, [hdi])

  // Corruption
  useEffect(() => {
    highlightMatchingCountries(Column.Corruption, val => parseFloat(val) < (corruption as number))
  }, [corruption])

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
        <label>
          <input
            type="checkbox"
            checked={showPotableWater}
            onChange={e => setShowPotableWater(e.target.checked)}
          />{' '}
          Potable Water
        </label>
        <br />
        Cost of living max:
        <input
        type="number"
        value={costOfLiving}
        onChange={e => setShowCostOfLiving(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Enter threshold number"
        min={0}
        max={120}
        />
        <br />
        HDI min:
        <input
        type="number"
        value={hdi}
        onChange={e => setShowHdi(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Enter threshold number"
        min={0}
        max={0.999}
        step={0.01}
        />
        <br />
        Corruption max:
        <input
        type="number"
        value={corruption}
        onChange={e => setShowCorruption(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Enter threshold number"
        min={0}
        max={99}
        />
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