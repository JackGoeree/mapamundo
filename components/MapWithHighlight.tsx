/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { FeatureCollection, GeoJSON as GeoJSONType } from "geojson";
import type { PathOptions } from "leaflet";
import Papa from "papaparse";

import MonthSlider from "./MonthSlider";
import { CsvFile, MapType, Metric, WeatherMetrics } from "./Enums";

import CrimeFilter from "./filters/CrimeFilter";
import HdiFilter from "./filters/HdiFilter";
import CostOfLivingFilter from "./filters/CostOfLivingFilter";
import CorruptionFilter from "./filters/CorruptionFilter";
import SmartravellerFilter from "./filters/SmartravellerFilter";

import GradientToggle from "./toggles/GradientToggle";
import MapTypeToggle from "./toggles/MapTypeToggle";

import {
  EntityStore,
  ingestCountryRow,
  ingestSubdivisionRow,
  applyNationalFallbacks,
  EntityMetrics,
  ingestSubdivisionFromGeoJson,
} from "./EntityStore";

// -------------------- CACHES --------------------
const csvCache = new Map<string, any[]>();
const geoJsonCache = new Map<string, any>();

// -------------------- TYPES --------------------
type MetricKey = keyof typeof Metric;
type MetricValue = (typeof Metric)[MetricKey];

// -------------------- COMPONENT --------------------
export default function MapWithHighlight() {
  // -------------------- STATE --------------------
  const [geoData, setGeoData] = useState<GeoJSONType | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [activeMetricKey, setActiveMetricKey] = useState<MetricKey>("JanFeels");
  const activeMetric = Metric[activeMetricKey];

  const [showPotableWater] = useState(false);
  const [democracyIndex] = useState<number | null>(null);
  const [costOfLiving, setCostOfLiving] = useState<number | null>(null);
  const [hdi, setHdi] = useState<number | null>(null);
  const [crime, setCrime] = useState<number | null>(null);
  const [corruption, setCorruption] = useState<number | null>(null);
  const [smartraveller, setSmartraveller] = useState<number | null>(null);

  const [allCountryValues, setAllCountryValues] = useState<Map<string, number>>(
    new Map(),
  );
  const [filteredCountryValues, setFilteredCountryValues] = useState<
    Map<string, number>
  >(new Map());

  const [monthIndex, setMonthIndex] = useState(0);

  const [activeMapType, setActiveMapType] = useState(MapType.Countries);

  const [gradientColumn, setGradientColumn] = useState<number | null>(null);
  const [gradientSource, setGradientSource] = useState<CsvFile | null>(null);

  const [filters, setFilters] = useState<((m: EntityMetrics) => boolean)[]>([]);

  // -------------------- REFS --------------------
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const nationalFallbackKeys = useRef<Set<string>>(new Set());

  const reversedGradientColumns = new Set<MetricValue>([
    Metric.HDI,
    Metric.Corruption,
  ]);

  const ethnicityColors: Map<string, string> = new Map();

  // -------------------- EFFECTS --------------------
  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    async function loadGeoJson() {
      try {
        console.log(activeMetric);
        const geoJson = await getGeoJson(activeMapType);
        setGeoData(geoJson);

        applyGradientWithFilters(activeMetric.column, filters);
      } catch (err) {
        console.error(err);
        setGeoData(null);
      }
    }
    loadGeoJson();
  }, [activeMapType]);

  useEffect(() => {
    if (gradientColumn != null && gradientSource != null) {
      applyGradientWithFilters(gradientColumn, filters);
    }
  }, [gradientColumn, gradientSource, filters]);

  useEffect(() => {
    if (geoJsonLayerRef.current && geoData) {
      geoJsonLayerRef.current.clearLayers();
      geoJsonLayerRef.current.addData(geoData);
    }
  }, [geoData]);

  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle((feature) => getStyle(feature));
    }
  }, [activeMetricKey, allCountryValues, nationalFallbackKeys]);

  useEffect(() => {
    if (!activeMetric) {
      setAllCountryValues(new Map());
      setFilteredCountryValues(new Map());
      return;
    }
    nationalFallbackKeys.current.clear();
    setGradientColumn(activeMetric.column);
    const csvFile = CsvFile.CountryValues;
    setGradientSource(csvFile);
  }, [activeMetric]);

  useEffect(() => {
    const weatherMetric = WeatherMetrics[monthIndex];
    setActiveMetricKey(weatherMetric);
  }, [monthIndex]);

  useEffect(() => {
    const newFilters: ((m: EntityMetrics) => boolean)[] = [];

    if (showPotableWater) {
      newFilters.push(
        (m) => m.PotableWater !== undefined && m.PotableWater >= 100,
      );
    }
    if (democracyIndex !== null) {
      newFilters.push(
        (m) =>
          m.DemocracyIndex !== undefined && m.DemocracyIndex > democracyIndex,
      );
    }
    if (costOfLiving !== null) {
      newFilters.push(
        (m) => m.CostOfLiving !== undefined && m.CostOfLiving < costOfLiving,
      );
    }
    if (hdi !== null) {
      newFilters.push((m) => m.HDI !== undefined && m.HDI > hdi);
    }
    if (crime !== null) {
      newFilters.push((m) => m.Crime !== undefined && m.Crime < crime);
    }
    if (corruption !== null) {
      newFilters.push(
        (m) => m.Corruption !== undefined && m.Corruption > corruption,
      );
    }
    if (smartraveller !== null) {
      newFilters.push(
        (m) => m.Smartraveller !== undefined && m.Smartraveller < smartraveller,
      );
    }

    setFilters(newFilters);
  }, [
    showPotableWater,
    democracyIndex,
    costOfLiving,
    hdi,
    crime,
    corruption,
    smartraveller,
  ]);

  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;

    layer.eachLayer((featureLayer) => {
      const feature = (featureLayer as any).feature;
      createOnEachFeature(allCountryValues)(feature, featureLayer);
    });
  }, [allCountryValues]);

  // -------------------- FUNCTIONS --------------------

  // -------------------- HELPER FUNCTIONS --------------------
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

  async function loadCsvData(source: CsvFile): Promise<any[]> {
    if (csvCache.has(source)) {
      console.log("Loaded csv from cache");
      return csvCache.get(source)!;
    }

    const res = await fetch(source);
    const csvText = await res.text();
    const results = Papa.parse<any[]>(csvText, { header: false });

    csvCache.set(source, results.data);
    console.log("Cached csv data");

    return results.data;
  }
  /*
  function handleNationalRow(
    row: any[],
    iso3: string,
    value: number,
    filters: ((row: any[]) => boolean)[],
    nationalValues: Map<string, number>,
    allMap: Map<string, number>,
    filteredMap: Map<string, number>,
  ) {
    nationalValues.set(iso3, value);
    allMap.set(row[0], value);

    if (passesFilters(row, filters)) {
      filteredMap.set(row[0], value);
    }
  }

  function handleSubdivisionRow(
    row: any[],
    countryKey: string,
    iso3: string,
    value: number | null,
    column: number,
    filters: ((row: any[]) => boolean)[],
    nationalValues: Map<string, number>,
    allMap: Map<string, number>,
    filteredMap: Map<string, number>,
  ) {
    if (value !== null) {
      allMap.set(countryKey, value);
      if (passesFilters(row, filters)) {
        filteredMap.set(countryKey, value);
      }
      return;
    }

    if (!nationalValues.has(iso3)) return;

    const nationalVal = nationalValues.get(iso3)!;
    allMap.set(countryKey, nationalVal);

    const fakeRow = [...row];
    fakeRow[column] = nationalVal.toString();

    if (passesFilters(fakeRow, filters)) {
      filteredMap.set(countryKey, nationalVal);
    }

    nationalFallbackKeys.current.add(countryKey);
  }

  function handleDefaultRow(
    row: any[],
    countryKey: string,
    value: number,
    filters: ((row: any[]) => boolean)[],
    allMap: Map<string, number>,
    filteredMap: Map<string, number>,
  ) {
    allMap.set(countryKey, value);

    if (passesFilters(row, filters)) {
      filteredMap.set(countryKey, value);
    }
  }

  function passesFilters(
    row: any[],
    filters: ((row: any[]) => boolean)[],
  ): boolean {
    return filters.every((f) => f(row));
  }*/

  // -------------------- STYLE FUNCTIONS --------------
  function getEthnicityColor(name: string) {
    if (!ethnicityColors.has(name)) {
      const index = ethnicityColors.size; // 0,1,2,...
      const hue = (index * 137.508) % 360; // golden angle for good spread
      const color = `hsl(${hue}, 65%, 55%)`;
      ethnicityColors.set(name, color);
    }
    return ethnicityColors.get(name)!;
  }

  const getColorForValue = (
    value: number,
    metric: MetricValue,
    reverse: boolean,
    isWeather: boolean,
  ) => {
    const min = metric.min;
    const max = metric.max;
    let ratio = (value - min) / (max - min);
    if (reverse) ratio = 1 - ratio;

    let r = 0,
      g = 0,
      b = 0;

    if (isWeather) {
      if (ratio < 0.5) {
        // blue to green
        const t = ratio / 0.5;
        r = 0;
        g = Math.round(255 * t);
        b = Math.round(255 * (1 - t));
      } else if (ratio < 0.75) {
        // green to yellow
        const t = (ratio - 0.5) / 0.25;
        r = Math.round(255 * t);
        g = 255;
        b = 0;
      } else {
        // yellow to red
        const t = (ratio - 0.75) / 0.25;
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
      }
    } else {
      if (ratio < 0.33) {
        // green to yellow
        r = Math.round(255 * (ratio / 0.33));
        g = 255;
      } else if (ratio < 0.66) {
        // yellow to orange
        r = 255;
        g = Math.round(255 * (1 - (ratio - 0.33) / 0.33));
      } else {
        // orange to red
        r = 255;
        g = 0;
      }
    }

    return `rgb(${r},${g},${b})`;
  };

  const getStyle = (feature: any): PathOptions => {
    const fillOpacity = 0.7;
    let fillColor = "#aaa"; // default: NO DATA
    const stroke = true;
    const weight = 0.5;

    if (activeMapType === MapType.Ethnicities) {
      const ethnicity = feature.properties.G1SHORTNAM?.trim();
      const fillColor = ethnicity ? getEthnicityColor(ethnicity) : "#ccc";
      return {
        fillColor,
        weight: 1,
        fillOpacity,
        color: "black",
      };
    }

    let iso3 = feature.properties.adm0_a3;

    let countryKey = iso3;

    if (activeMapType === MapType.Subdivisions) {
      const name = feature.properties.name?.trim();
      iso3 = feature.properties.adm1_code?.split("-")[0];
      countryKey = `${iso3}:${name}`;
    }

    const hasData = allCountryValues.has(countryKey);
    const filteredValue = filteredCountryValues.get(countryKey);
    const reverse = reversedGradientColumns.has(activeMetric);
    const isWeather = WeatherMetrics.includes(activeMetricKey);

    if (filteredValue !== undefined) {
      // Value exists AND passes filters
      fillColor = getColorForValue(
        filteredValue,
        activeMetric,
        reverse,
        isWeather,
      );
      if (iso3 == "KAZ") console.log("Kaz passes filters");
    } else if (hasData) {
      // Has value but filtered out
      fillColor = "#777";
      if (iso3 == "KAZ") console.log("Kaz filtered out");
    } else {
      if (iso3 == "KAZ") console.log("Kaz no data");
    }

    return {
      fillColor,
      weight,
      fillOpacity,
      color: "black",
      stroke,
    };
  };

  // -------------------- MAP FUNCTIONS --------------

  const createOnEachFeature =
    (values: Map<string, number>) => (feature: any, layer: L.Layer) => {
      const props = feature.properties;
      const name = props.name?.trim();
      const country = props.admin;
      let popupContent = "";
      let iso3 = feature.properties.adm0_a3;
      let countryKey = iso3;

      if (activeMapType === MapType.Subdivisions) {
        iso3 = feature.properties.adm1_code?.split("-")[0];
        countryKey = `${iso3}:${name}`;
      }

      if (activeMapType === MapType.Ethnicities) {
        const ethnicity = props.G1SHORTNAM?.trim() ?? "Unknown";
        popupContent = `<strong>${ethnicity}</strong>`;
      } else {
        const value = values.get(countryKey);
        const popupTitle =
          activeMapType === MapType.Countries
            ? `<strong>${name}<br />`
            : `<strong>${name}, </strong>${country}<br />`;

        popupContent = `${popupTitle}
          ${
            value !== undefined
              ? `${activeMetric.name}: ${value}${
                  nationalFallbackKeys.current.has(countryKey)
                    ? "<br /> (Estimate from national data)"
                    : ""
                }`
              : "No data"
          }`;
      }

      layer.bindPopup(popupContent);
      layer.on({ click: () => layer.openPopup() });
    };

  async function applyGradientWithFilters(
    _column: number,
    filters: ((metrics: any) => boolean)[],
  ) {
    const store: EntityStore = new Map();

    // load countries
    const countryData = await loadCsvData(CsvFile.CountryValues);
    countryData.forEach((row) => ingestCountryRow(store, row));

    // load subdivisions in geojson
    if (activeMapType === MapType.Subdivisions && geoData) {
      (geoData as FeatureCollection).features.forEach((feature: any) => {
        ingestSubdivisionFromGeoJson(store, feature);
      });
    }

    // load subdivisions in CSV - overwrite geojson subdivisions if match
    if (activeMapType === MapType.Subdivisions) {
      countryData.forEach((row) => ingestSubdivisionRow(store, row));
    }

    applyNationalFallbacks(store);

    const all = new Map<string, number>();
    const filtered = new Map<string, number>();
    const fallbackKeys = new Set<string>();

    for (const [id, entity] of store) {
      const value = entity.metrics[activeMetricKey];
      if (value === undefined) continue;

      all.set(id, value);

      if (filters.every((f) => f(entity.metrics))) {
        filtered.set(id, value);
      }

      if (entity.fallback.has(activeMetricKey)) {
        fallbackKeys.add(id);
      }
    }

    setAllCountryValues(all);
    setFilteredCountryValues(filtered);
    nationalFallbackKeys.current = fallbackKeys;
  }

  // -------------------- RENDER --------------------
  if (!isClient) return <div>Loading map...</div>;

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          backgroundColor: "white",
          padding: "8px 12px",
          borderRadius: 4,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 1000,
          fontFamily: "sans-serif",
          color: "black",
        }}
      >
        MAP TYPE
        <br />
        <MapTypeToggle
          label={"Country"}
          value={MapType.Countries}
          activeMapType={activeMapType}
          setActiveMapType={setActiveMapType}
        />
        <MapTypeToggle
          label={"Subdivision"}
          value={MapType.Subdivisions}
          activeMapType={activeMapType}
          setActiveMapType={setActiveMapType}
        />
        <MapTypeToggle
          label={"Ethnicities"}
          value={MapType.Ethnicities}
          activeMapType={activeMapType}
          setActiveMapType={setActiveMapType}
        />
        <br />
        WEATHER
        <br />
        <MonthSlider monthIndex={monthIndex} setMonthIndex={setMonthIndex} />
        <br />
        GRADIENTS
        <br />
        <GradientToggle
          label="Cost Of Living"
          value="CostOfLiving"
          activeMetricKey={activeMetricKey}
          setActiveMetricKey={setActiveMetricKey}
        />
        <GradientToggle
          label="HDI"
          value="HDI"
          activeMetricKey={activeMetricKey}
          setActiveMetricKey={setActiveMetricKey}
        />
        <GradientToggle
          label="Crime"
          value="Crime"
          activeMetricKey={activeMetricKey}
          setActiveMetricKey={setActiveMetricKey}
        />
        <GradientToggle
          label="Corruption"
          value="Corruption"
          activeMetricKey={activeMetricKey}
          setActiveMetricKey={setActiveMetricKey}
        />
        <GradientToggle
          label="Smartraveller"
          value="Smartraveller"
          activeMetricKey={activeMetricKey}
          setActiveMetricKey={setActiveMetricKey}
        />
        <br />
        FILTERS
        <br />
        <CostOfLivingFilter
          costOfLiving={costOfLiving}
          setCostOfLiving={setCostOfLiving}
        />
        <HdiFilter hdi={hdi} setHdi={setHdi} />
        <CrimeFilter crime={crime} setCrime={setCrime} />
        <CorruptionFilter
          corruption={corruption}
          setCorruption={setCorruption}
        />
        <SmartravellerFilter
          smartraveller={smartraveller}
          setSmartraveller={setSmartraveller}
        />
      </div>

      {/* Map */}
      <MapContainer
        style={{ height: "100%", width: "100%" }}
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <TileLayer
          url="/data/chelsa/{z}/{x}/{y}.png"
          opacity={0.6}
          zIndex={10}
          maxNativeZoom={7}
        />
        {geoData && allCountryValues.size > 0 && (
          <GeoJSON
            data={geoData}
            ref={geoJsonLayerRef}
            key={activeMapType}
            style={getStyle}
            onEachFeature={createOnEachFeature(allCountryValues)}
          />
        )}
      </MapContainer>
    </div>
  );
}
