import { act, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Feature, GeoJSON as GeoJSONType, Geometry } from 'geojson'
import type { PathOptions } from 'leaflet'
import Papa from 'papaparse'
import MonthSlider from './MonthSlider'
import { CsvFile, MapType, Metric, WeatherMetrics } from './Enums'
import CrimeFilter from './filters/CrimeFilter'
import HdiFilter from './filters/HdiFilter'
import CostOfLivingFilter from './filters/CostOfLivingFilter'
import CorruptionFilter from './filters/CorruptionFilter'
import DemocracyFilter from './filters/DemocracyFilter'


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


type MetricKey = keyof typeof Metric;
type MetricValue = (typeof Metric)[MetricKey];

export default function MapWithHighlight() {
const [geoData, setGeoData] = useState<GeoJSONType | null>(null)
const [highlightCountries, setHighlightCountries] = useState<Set<string>>(new Set())
const [isClient, setIsClient] = useState(false)
const [activeMetricKey, setActiveMetricKey] = useState<MetricKey>("JanFeels");
const activeMetric = Metric[activeMetricKey];
const [showPotableWater, setShowPotableWater] = useState(false);
const [democracyIndex, setDemocracyIndex] = useState<number | null>(null)
const [costOfLiving, setCostOfLiving] = useState<number | null>(null)
const [hdi, setHdi] = useState<number | null>(null);
const [crime, setCrime] = useState<number | null>(null);
const [corruption, setCorruption] = useState<number | null>(null)

const [countryValues, setCountryValues] = useState<Map<string, number>>(new Map())

const [monthIndex, setMonthIndex] = useState(0);

const [activeMapType, setActiveMapType] = useState(MapType.Countries);

const [gradientColumn, setGradientColumn] = useState<number | null>(null);
const [gradientSource, setGradientSource] = useState<CsvFile | null>(null);

const [filters, setFilters] = useState<((row: any[]) => boolean)[]>([]);

const reversedGradientColumns = new Set<MetricValue>([
  Metric.HDI,
  Metric.Corruption
])


  useEffect(() => {
    setIsClient(true)
  }, [])

useEffect(() => {
  async function loadGeoJson() {
    try {
      console.log(activeMetric);
      const geoJson = await getGeoJson(activeMapType);
      setGeoData(geoJson);

      applyGradientWithFilters(activeMetric.column,  WeatherMetrics.includes(activeMetricKey!!) ? CsvFile.SubdivisionWeather : CsvFile.CountryValues, filters);
    } catch (err) {
      console.error(err);
      setGeoData(null);
    }
  }

  loadGeoJson()

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

  useEffect(() => {
  if (geoJsonLayerRef.current && geoData) {
    geoJsonLayerRef.current.clearLayers();
    geoJsonLayerRef.current.addData(geoData);
  }
}, [geoData]);

  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(feature => getStyle(feature));
    }
  }, [activeMetricKey, countryValues, highlightCountries]); // run effect when these change

const getStyle = (feature: any): PathOptions => {
  if (activeMapType === MapType.Ethnicities) {
    const ethnicity = feature.properties.G1SHORTNAM?.trim();
    const fillColor = ethnicity ? getEthnicityColor(ethnicity) : '#ccc';
    return {
      fillColor,
      weight: 1,
      fillOpacity: 0.7,
      color: 'black'
    };
  }
  let name = feature.properties.name?.trim();
  const name_en = feature.properties.name_en?.trim();
  let country_iso3 = feature.properties.adm1_code?.split('-')[0];
  let countryKey = `${country_iso3}:${name}`;

  if (activeMapType === MapType.Countries) {
    //name = feature.properties.admin.trim();
    //country_iso3 = feature.properties.iso_a3.trim();
    countryKey = name;
  }


  const isHighlighted = highlightCountries.has(name) || highlightCountries.has(name_en);
  //console.log("Getstyle countrykey: " + countryKey);
  //console.log(countryValues);
  const value = countryValues.get(countryKey)// ?? countryValues.get(name_en);
  //console.log(value);

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

const ethnicityColors: Map<string, string> = new Map();

function getEthnicityColor(name: string) {
  if (!ethnicityColors.has(name)) {
    const index = ethnicityColors.size;  // 0,1,2,...
    const hue = (index * 137.508) % 360; // golden angle for good spread
    const color = `hsl(${hue}, 65%, 55%)`;
    ethnicityColors.set(name, color);
  }
  return ethnicityColors.get(name)!;
}

async function applyGradientWithFilters(
  column: number,
  source: CsvFile,  // Assuming source is a URL string for fetch
  filters: ((row: any[]) => boolean)[]
) {
  try {
    console.log("Running applyGradientWithFilters", {column}, {source}, {activeMetric}, {filters});
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
      
      const countryIso3 = String(row[1].split('.')[0])
      let countryKey = `${countryIso3}:${countryName}`;

      if (activeMapType === MapType.Countries) {
        //console.log(activeMapType);
          countryKey = countryName;
      }

      //console.log("applygradient countryKey: " + countryKey);
      if (filters.every(f => f(row))) {
        const val = parseFloat(row[column]);
        if (!isNaN(val)) {
          valueMap.set(countryKey, val);
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

  if (democracyIndex !== null) {
    filters.push(row => parseFloat(row[Metric.DemocracyIndex.column]) > democracyIndex)
  }

  if (costOfLiving !== null) {
    filters.push(row => parseFloat(row[Metric.CostOfLiving.column]) < costOfLiving)
  }

  if (hdi !== null) {
    filters.push(row => parseFloat(row[Metric.HDI.column]) > hdi)
  }

  if (crime !== null) {
    filters.push(row => parseFloat(row[Metric.Crime.column]) < crime)
  }

  if (corruption !== null) {
    filters.push(row => parseFloat(row[Metric.Corruption.column]) > corruption)
  }

  setFilters(filters)
}, [
  showPotableWater,
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
  const props = feature.properties;
  const name = props.name?.trim();
  const country = props.admin;
  const country_iso3 = props.adm1_code?.split('-')[0]?.trim();
  let countryKey = `${country_iso3}:${name}`;


  if (activeMapType === MapType.Countries) {
    //name = feature.properties.admin.trim();
    //country_iso3 = feature.properties.iso_a3.trim();
    countryKey = name;
  }
  
    let popupContent = '';
  
  if (activeMapType === MapType.Ethnicities) {
    const ethnicity = props.G1SHORTNAM?.trim() ?? 'Unknown';
    popupContent = `<strong>${ethnicity}</strong>`;
  } else {
    const value = values.get(countryKey);
    const popupTitle = activeMapType === MapType.Countries 
      ? `<strong>${name}<br />` 
      : `<strong>${name}, </strong>${country}<br />`;

    popupContent = `${popupTitle}
      ${value !== undefined ? `${activeMetric.name}: ${value}` : 'No data'}
    `;
  }

  layer.bindPopup(popupContent); 

  layer.on({
    click: () => {
      layer.openPopup();
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
        <label>
          <input
            type="radio"
            name="mapType"
            value={MapType.Ethnicities}
            checked={activeMapType === MapType.Ethnicities}
            onChange={() => setActiveMapType(MapType.Ethnicities)}
          />{' '}
          Ethnicities
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
  <DemocracyFilter democracy={democracyIndex} setDemocracy={setDemocracyIndex} />
  <CostOfLivingFilter costOfLiving={costOfLiving} setCostOfLiving={setCostOfLiving} />
  <HdiFilter hdi={hdi} setHdi={setHdi} />
  <CrimeFilter crime={crime} setCrime={setCrime} />
  <CorruptionFilter corruption={corruption} setCorruption={setCorruption} />
</div>

      {/* Map */}
      <MapContainer
        style={{ height: '100%', width: '100%' }}
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
  />
          <TileLayer
          url="/data/chelsa/{z}/{x}/{y}.png"opacity={0.6} // Adjust for visibility
    zIndex={10} // Ensure it's above base layer
     maxNativeZoom={7}
          //attribution='&copy; OpenStreetMap contributors'
          //url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && countryValues.size > 0 && <GeoJSON data={geoData} ref={geoJsonLayerRef} 
        key={activeMapType}
        style={getStyle} onEachFeature={createOnEachFeature(countryValues)} />}
      </MapContainer>
    </div>
  )
}