import { act, useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Feature, GeoJSON as GeoJSONType, Geometry } from 'geojson'
import type { PathOptions } from 'leaflet'
import Papa from 'papaparse'
import MonthSlider from './MonthSlider'

const enum Column {
  PotableWater = 1,
  DemocracyIndex = 2,
  Smartraveller = 3,
  CostOfLiving = 4,
  HDI = 5,
  Crime = 6,
  Corruption = 7,
  JanFeels = 26,
  FebFeels = 27,
  MarFeels = 28,
  AprFeels = 29,
  MayFeels = 30,
  JunFeels = 31,
  JulFeels = 32,
  AugFeels = 33,
  SepFeels = 34,
  OctFeels = 35,
  NovFeels = 36,
  DecFeels = 37
}

const enum CsvFile {
  CountryValues = "/data/countries_values.csv",
  CountryWeather = "/data/countries_weather.csv"
}

export default function MapWithHighlight() {
const [geoData, setGeoData] = useState<GeoJSONType | null>(null)
const [highlightCountries, setHighlightCountries] = useState<Set<string>>(new Set())
const [isClient, setIsClient] = useState(false)
const [activeMetric, setActiveMetric] = useState<null | Column>(null)
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

const [countryValues, setCountryValues] = useState<Map<string, number>>(new Map())

const [monthIndex, setMonthIndex] = useState(0);




const reversedGradientColumns = new Set<Column>([
  Column.HDI,
  Column.Corruption
])

const monthColumns: Column[] = [
  Column.JanFeels,
  Column.FebFeels,
  Column.MarFeels,
  Column.AprFeels,
  Column.MayFeels,
  Column.JunFeels,
  Column.JulFeels,
  Column.AugFeels,
  Column.SepFeels,
  Column.OctFeels,
  Column.NovFeels,
  Column.DecFeels
]

const activeMonth = monthColumns[monthIndex];


  useEffect(() => {
    setIsClient(true)

    // Load GeoJSON
    fetch('/data/countries.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(console.error)
  }, [])

  const getColorForValue = (value: number, min: number, max: number, reverse: boolean, isWeather: boolean) => {
  let ratio = (value - min) / (max - min)

  if (reverse) {
    ratio = 1 - ratio
  }

  // ratio goes from 0 (low) to 1 (high)
  let r = 0, g = 0, b = 0

  if (ratio < 0.33) {
    // green to yellow
    r = Math.round(255 * (ratio / 0.33))
    g = 255
  } else if (ratio < 0.66) {
    // yellow to orange
    r = 255
    g = Math.round(255 * (1 - (ratio - 0.33) / 0.33))
  } else {
    // orange to red
    r = 255
    g = 0
  }

  if (isWeather) {
    
    min = 0
    max = 50  
    ratio = (value - min) / (max - min)

    if (ratio < 0.5) {
      // blue to green
      let t = ratio / 0.5; // 0 to 1
      r = 0;
      g = Math.round(255 * t);
      b = Math.round(255 * (1 - t));
    } else {
      // green to yellow to red
      if (ratio < 0.75) {
        // green to yellow
        let t = (ratio - 0.5) / 0.25; // 0 to 1
        r = Math.round(255 * t);
        g = 255;
        b = 0;
      } else {
        // yellow to red
        let t = (ratio - 0.75) / 0.25; // 0 to 1
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
      }
    }
  }

  return `rgb(${r},${g},${b})`
}

const getStyle = (feature: any): PathOptions => {
  const name = feature.properties.ADMIN || feature.properties.name
  const isHighlighted = highlightCountries.has(name)
  const value = countryValues.get(name)

  let fillColor = isHighlighted ? 'green' : '#ccc'

  if (countryValues.size > 0 && value !== undefined) {
    const values = Array.from(countryValues.values())
    const min = Math.min(...values)
    const max = Math.max(...values)
    const reverse = reversedGradientColumns.has(activeMetric!!)
    const isWeather = !activeMetric && monthColumns.includes(activeMonth!!)

    fillColor = getColorForValue(value, min, max, reverse, isWeather)
  }

  return {
    fillColor,
    weight: 1,
    fillOpacity: 0.7,
    color: 'black',
  }
}

  useEffect(() => {
  if (!activeMetric) {
    setCountryValues(new Map())
    return
  }
  fetchGradientData(activeMetric, CsvFile.CountryValues)
}, [activeMetric])

useEffect(() => {
  if (!activeMonth) {
    setCountryValues(new Map())
    return
  }
  fetchGradientData(activeMonth, CsvFile.CountryWeather)
}, [activeMonth])

const fetchGradientData = async (column: number, source: CsvFile) => {
  console.log("Fetch gradient data for column " + column);
    try {
      const res = await fetch(source)
      const csvText = await res.text()
      const results = Papa.parse<any[]>(csvText, { header: false })
      const valueMap = new Map<string, number>()

      results.data.forEach(row => {
        const name = row[0]
        const val = parseFloat(row[column])
        if (name && !isNaN(val)) {
          valueMap.set(name.toString(), val)
        }
      })

      setCountryValues(valueMap)
    } catch (err) {
      console.error(err)
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
    const res = await fetch(CsvFile.CountryValues)
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
        WEATHER
        <br />
        <MonthSlider monthIndex={monthIndex} setMonthIndex={setMonthIndex} />
        <br />
        GRADIENTS
<br />
        <label>
  <input
    type="checkbox"
    checked={activeMetric === Column.CostOfLiving}
     onChange={(e) => setActiveMetric(e.target.checked ? Column.CostOfLiving : null)}
  />
  {' '}Cost of Living
</label>
<br />
<label>
  <input
    type="checkbox"
    checked={activeMetric === Column.HDI}
     onChange={(e) => setActiveMetric(e.target.checked ? Column.HDI : null)}
  />
  {' '}HDI
</label>
<br />
<label>
  <input
    type="checkbox"
    checked={activeMetric === Column.Crime}
     onChange={(e) => setActiveMetric(e.target.checked ? Column.Crime : null)}
  />
  {' '}Crime
</label>
<br />
<label>
  <input
    type="checkbox"
    checked={activeMetric === Column.Corruption}
     onChange={(e) => setActiveMetric(e.target.checked ? Column.Corruption : null)}
  />
  {' '}Corruption
</label>
<br /><br />
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
        {geoData && <GeoJSON data={geoData} style={getStyle} />}
      </MapContainer>
    </div>
  )
}