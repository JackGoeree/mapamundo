import { act, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Feature, GeoJSON as GeoJSONType, Geometry } from 'geojson'
import type { PathOptions } from 'leaflet'
import Papa from 'papaparse'
import MonthSlider from './MonthSlider'

const WeatherMin = -10
const WeatherMax = 45

const csvCache = new Map<string, any[]>();
const geoJsonCache = new Map<string, any>();

async function getGeoJson(source: string): Promise<any> {
  if (geoJsonCache.has(source)) {
    console.log("Loaded GeoJSON from cache");
    return geoJsonCache.get(source);
  } else {
    const res = await fetch(source);
    const geoJson = await res.json();
    geoJsonCache.set(source, geoJson);
    console.log("Fetched and cached GeoJSON");
    return geoJson;
  }
}

const Metric = {
  Null: { name: "Null", column: -1, min: 0, max: 100},
  PotableWater: { name: "Potable water", column: 1, min: 0, max: 100 },
  DemocracyIndex: { name: "Democracy index", column: 2, min: 0, max: 100 },
  Smartraveller: { name: "Smartraveller safety", column: 3, min: 0, max: 5 },
  CostOfLiving: { name: "Cost of living", column: 4, min: 10, max: 100 },
  HDI: { name: "Human Development Index", column: 5, min: 0.2, max: 1.0 },
  Crime: { name: "Crime index", column: 6, min: 20, max: 100 },
  Corruption: { name: "Corruption index", column: 7, min: -10, max: 80 },
  JanFeels: { name: "January feels-like temperature", column: 26, min: WeatherMin, max: WeatherMax },
  FebFeels: { name: "February feels-like temperature", column: 27, min: WeatherMin, max: WeatherMax },
  MarFeels: { name: "March feels-like temperature", column: 28, min: WeatherMin, max: WeatherMax },
  AprFeels: { name: "April feels-like temperature", column: 29, min: WeatherMin, max: WeatherMax },
  MayFeels: { name: "May feels-like temperature", column: 30, min: WeatherMin, max: WeatherMax },
  JunFeels: { name: "June feels-like temperature", column: 31, min: WeatherMin, max: WeatherMax },
  JulFeels: { name: "July feels-like temperature", column: 32, min: WeatherMin, max: WeatherMax },
  AugFeels: { name: "August feels-like temperature", column: 33, min: WeatherMin, max: WeatherMax },
  SepFeels: { name: "September feels-like temperature", column: 34, min: WeatherMin, max: WeatherMax },
  OctFeels: { name: "October feels-like temperature", column: 35, min: WeatherMin, max: WeatherMax },
  NovFeels: { name: "November feels-like temperature", column: 36, min: WeatherMin, max: WeatherMax },
  DecFeels: { name: "December feels-like temperature", column: 37, min: WeatherMin, max: WeatherMax }
} as const;

const WeatherMetrics: MetricKey[] = [
  "JanFeels", "FebFeels", "MarFeels", "AprFeels", "MayFeels", "JunFeels",
  "JulFeels", "AugFeels", "SepFeels", "OctFeels", "NovFeels", "DecFeels"
];


const enum CsvFile {
  CountryValues = "/data/countries_values.csv",
  //CountryWeather = "/data/countries_weather.csv",
  SubdivisionWeather = "/data/subdivisions_weather.csv"
}

const enum MapType {
  Countries = '/data/countries.geo.json',
  Subdivisions = '/data/subdivisions.geo.json'
}

type MetricKey = keyof typeof Metric;
type MetricValue = (typeof Metric)[MetricKey];

export default function MapWithHighlight() {
const [geoData, setGeoData] = useState<GeoJSONType | null>(null)
const [highlightCountries, setHighlightCountries] = useState<Set<string>>(new Set())
const [isClient, setIsClient] = useState(false)
const [activeMetricKey, setActiveMetricKey] = useState<MetricKey>("JanFeels");
const activeMetric = Metric[activeMetricKey];
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

const [activeMapType, setActiveMapType] = useState(MapType.Countries);

const [gradientColumn, setGradientColumn] = useState<number | null>(null);
const [gradientSource, setGradientSource] = useState<CsvFile | null>(null);

const [filters, setFilters] = useState<((row: any[]) => boolean)[]>([]);

/*const filters = useMemo(() => {
  const result: ((row: any[]) => boolean)[] = [];

  if (showDemocracyIndex && democracyIndex !== null) {
    result.push((row) => parseFloat(row[Metric.DemocracyIndex.column]) >= democracyIndex);
  }
  if (showCostOfLiving && costOfLiving !== null) {
    result.push((row) => parseFloat(row[Metric.CostOfLiving.column]) <= costOfLiving);
  }
  if (showHDI && hdi !== null) {
    result.push((row) => parseFloat(row[Metric.HDI.column]) >= hdi);
  }
  if (showCrime && crime !== null) {
    result.push((row) => parseFloat(row[Metric.Crime.column]) <= crime);
  }
  if (showCorruption && corruption !== null) {
    result.push((row) => parseFloat(row[Metric.Corruption.column]) <= corruption);
  }
  if (showPotableWater) {
    result.push((row) => parseFloat(row[Metric.PotableWater.column]) >= 1);
  }

  return result;
}, [
  showDemocracyIndex,
  democracyIndex,
  showCostOfLiving,
  costOfLiving,
  showHDI,
  hdi,
  showCrime,
  crime,
  showCorruption,
  corruption,
  showPotableWater,
]);*/


const reversedGradientColumns = new Set<MetricValue>([
  Metric.HDI,
  Metric.Corruption
])

//const activeMonth = weatherMetrics[monthIndex];


  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
  async function loadGeoJson() {
    try {
      // activeMapType should be the URL to GeoJSON file
      const geoJson = await getGeoJson(activeMapType);
      setGeoData(geoJson);
    } catch (err) {
      console.error(err);
      setGeoData(null);
    }
  }
  loadGeoJson();
}, [activeMapType]);

useEffect(() => {
  if (gradientColumn != null && gradientSource != null) {
    applyGradientWithFilters(gradientColumn, gradientSource, filters);
  }
}, [gradientColumn, gradientSource, filters]);

  const getColorForValue = (value: number, metric: MetricValue, reverse: boolean, isWeather: boolean) => {

  let min = metric.min
  let max = metric.max 

  let ratio = (value - min) / (max - min)

  if (reverse) {
    ratio = 1 - ratio
  }

  // ratio goes from 0 (low) to 1 (high)
  let r = 0, g = 0, b = 0

  if (isWeather) {

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
  } else {
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
  }
  return `rgb(${r},${g},${b})`
}

  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // On activeMetric, countryValues, or highlightCountries change,
  // update the styles on the existing GeoJSON layer
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(feature => getStyle(feature));
    }
  }, [activeMetricKey, countryValues, highlightCountries]); // run effect when these change

const getStyle = (feature: any): PathOptions => {
  const name = feature.properties.name?.trim();
  const name_en = feature.properties.name_en?.trim();

  const isHighlighted = highlightCountries.has(name) || highlightCountries.has(name_en);
  const value = countryValues.get(name) ?? countryValues.get(name_en);

  let fillColor = isHighlighted ? 'green' : '#ccc'

  if (countryValues.size > 0 && value !== undefined) {
    const reverse = reversedGradientColumns.has(activeMetric!!)
    const isWeather = WeatherMetrics.includes(activeMetricKey!!)

    fillColor = getColorForValue(value, activeMetric, reverse, isWeather)
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
  setGradientColumn(activeMetric.column);
  let csvFile = WeatherMetrics.includes(activeMetricKey) ? CsvFile.SubdivisionWeather : CsvFile.CountryValues
  setGradientSource(csvFile);
}, [activeMetric])

useEffect(() => {
  let weatherMetric = WeatherMetrics[monthIndex]
  setActiveMetricKey(weatherMetric)
}, [monthIndex])


async function applyGradientWithFilters(
  column: number,
  source: CsvFile,  // Assuming source is a URL string for fetch
  filters: ((row: any[]) => boolean)[]
) {
  try {
    console.log("Running applyGradientWithFilters", { source, filters }, performance.now());
    let data: any[];
    
    // Use cached data if available
    if (csvCache.has(source)) {
      data = csvCache.get(source)!;
      console.log("Loaded csv from cache");
    } else {
      const res = await fetch(source);
      const csvText = await res.text();
      const results = Papa.parse<any[]>(csvText, { header: false });
      data = results.data;
      csvCache.set(source, data);
      console.log("Cached csv data");
    }

    console.log("CSV loaded ", performance.now())

    const valueMap = new Map<string, number>();

    // Single loop: filter rows and build valueMap in one go
    for (const row of data) {
      if (!row || row.length === 0) continue;

      const countryName = String(row[0]);
      if (filters.every(f => f(row))) {
        const val = parseFloat(row[column]);
        if (!isNaN(val)) {
          valueMap.set(countryName, val);
        }
      }
    }

    console.log("Value map loaded ", performance.now())

    setCountryValues(valueMap);

    console.log("Country values set ", performance.now())

  } catch (err) {
    console.error(err);
    setCountryValues(new Map());
  }
}

    useEffect(() => {
  const filters: ((row: any[]) => boolean)[] = []

  if (showPotableWater) {
    filters.push(row => row[Metric.PotableWater.column]?.toLowerCase() === 'true')
  }

  if (showDemocracyIndex && democracyIndex !== null) {
    filters.push(row => parseFloat(row[Metric.DemocracyIndex.column]) > democracyIndex)
  }

  if (showCostOfLiving && costOfLiving !== null) {
    filters.push(row => parseFloat(row[Metric.CostOfLiving.column]) < costOfLiving)
  }

  if (showHDI && hdi !== null) {
    filters.push(row => parseFloat(row[Metric.HDI.column]) > hdi)
  }

  if (showCrime && crime !== null) {
    filters.push(row => parseFloat(row[Metric.Crime.column]) < crime)
  }

  if (showCorruption && corruption !== null) {
    filters.push(row => parseFloat(row[Metric.Corruption.column]) > corruption)
  }

  if (filters.length === 0) {
    //setHighlightCountries(new Set())
    return
  }

  setFilters(filters)//.then(setHighlightCountries)
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


useEffect(() => {
  const layer = geoJsonLayerRef.current;
  if (!layer) return;

  layer.eachLayer((featureLayer) => {
    const feature = (featureLayer as any).feature;
    createOnEachFeature(countryValues)(feature, featureLayer);
  });
}, [countryValues]);


const createOnEachFeature = (values: Map<string, number>) => (
  feature: any,
  layer: L.Layer
) => {
  layer.on({
    click: () => {
      const props = feature.properties;
      const name = props.name;
      const value = values.get(name);

      const popupContent = `
        <strong>${name}</strong><br />
        ${value !== undefined ? `${activeMetric.name}: ${value}` : 'No data'}
      `;

      layer.bindPopup(popupContent).openPopup();
    }
  });
};

  if (!isClient) {
    return <div>Loading map...</div>
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%'}}>
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
        
        MAP TYPE
        <br />
        <label>
          <input
            type="radio"
            name="mapType"
            value={MapType.Countries}
            checked={activeMapType === MapType.Countries}
            onChange={() => setActiveMapType(MapType.Countries)}
          />{' '}
          Country
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="mapType"
            value={MapType.Subdivisions}
            checked={activeMapType === MapType.Subdivisions}
            onChange={() => setActiveMapType(MapType.Subdivisions)}
          />{' '}
          Subdivision
        </label>
  <br />
  <br />
        WEATHER
        <br />
        <MonthSlider monthIndex={monthIndex} setMonthIndex={setMonthIndex} />
        <br />
        GRADIENTS
<br />
        <label>
  <input
    type="radio"
    checked={activeMetricKey === "CostOfLiving"}
    onChange={(e) =>
      setActiveMetricKey(e.target.checked ? "CostOfLiving" : "Null")
  }
  />
  {' '}Cost of Living
</label>
<br />
<label>
  <input
    type="radio"
    checked={activeMetricKey === "HDI"}
     onChange={(e) => setActiveMetricKey(e.target.checked ? "HDI" : "Null")}
  />
  {' '}HDI
</label>
<br />
<label>
  <input
    type="radio"
    checked={activeMetricKey === "Crime"}
     onChange={(e) => setActiveMetricKey(e.target.checked ? "Crime" : "Null")}
  />
  {' '}Crime
</label>
<br />
<label>
  <input
    type="radio"
    checked={activeMetric === Metric.Corruption}
     onChange={(e) => setActiveMetricKey(e.target.checked ? "Corruption" : "Null")}
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
        {geoData && countryValues.size > 0 && <GeoJSON data={geoData} ref={geoJsonLayerRef} 
        key={activeMapType}
        style={getStyle} onEachFeature={createOnEachFeature(countryValues)} />}
      </MapContainer>
    </div>
  )
}