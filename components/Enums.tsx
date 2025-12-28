const WeatherMin = -10;
const WeatherMax = 45;

export type MetricKey = keyof typeof Metric;

export const Metric = {
  Null: { name: "Null", column: -1, min: 0, max: 100 },
  PotableWater: { name: "Potable water", column: 2, min: 0, max: 100 },
  DemocracyIndex: { name: "Democracy index", column: 3, min: 0, max: 100 },
  Smartraveller: { name: "Smartraveller safety", column: 4, min: 1, max: 5 },
  CostOfLiving: { name: "Cost of living", column: 52, min: 500, max: 5000 },
  HDI: { name: "Human Development Index", column: 6, min: 0.2, max: 1.0 },
  Crime: { name: "Crime index", column: 7, min: 20, max: 100 },
  Corruption: { name: "Corruption index", column: 8, min: -10, max: 80 },
  JanFeels: {
    name: "January feels-like temperature",
    column: 26,
    min: WeatherMin,
    max: WeatherMax,
  },
  FebFeels: {
    name: "February feels-like temperature",
    column: 27,
    min: WeatherMin,
    max: WeatherMax,
  },
  MarFeels: {
    name: "March feels-like temperature",
    column: 28,
    min: WeatherMin,
    max: WeatherMax,
  },
  AprFeels: {
    name: "April feels-like temperature",
    column: 29,
    min: WeatherMin,
    max: WeatherMax,
  },
  MayFeels: {
    name: "May feels-like temperature",
    column: 30,
    min: WeatherMin,
    max: WeatherMax,
  },
  JunFeels: {
    name: "June feels-like temperature",
    column: 31,
    min: WeatherMin,
    max: WeatherMax,
  },
  JulFeels: {
    name: "July feels-like temperature",
    column: 32,
    min: WeatherMin,
    max: WeatherMax,
  },
  AugFeels: {
    name: "August feels-like temperature",
    column: 33,
    min: WeatherMin,
    max: WeatherMax,
  },
  SepFeels: {
    name: "September feels-like temperature",
    column: 34,
    min: WeatherMin,
    max: WeatherMax,
  },
  OctFeels: {
    name: "October feels-like temperature",
    column: 35,
    min: WeatherMin,
    max: WeatherMax,
  },
  NovFeels: {
    name: "November feels-like temperature",
    column: 36,
    min: WeatherMin,
    max: WeatherMax,
  },
  DecFeels: {
    name: "December feels-like temperature",
    column: 37,
    min: WeatherMin,
    max: WeatherMax,
  },
} as const;

export const WeatherMetrics: MetricKey[] = [
  "JanFeels",
  "FebFeels",
  "MarFeels",
  "AprFeels",
  "MayFeels",
  "JunFeels",
  "JulFeels",
  "AugFeels",
  "SepFeels",
  "OctFeels",
  "NovFeels",
  "DecFeels",
];

export const Metrics: MetricKey[] = [
  "Null",
  "PotableWater",
  "DemocracyIndex",
  "Smartraveller",
  "CostOfLiving",
  "HDI",
  "Crime",
  "Corruption",
  "Corruption",
  "JanFeels",
  "FebFeels",
  "MarFeels",
  "AprFeels",
  "MayFeels",
  "JunFeels",
  "JulFeels",
  "AugFeels",
  "SepFeels",
  "OctFeels",
  "NovFeels",
  "DecFeels",
];

export const enum CsvFile {
  CountryValues = "/data/countries_values.csv",
  SubdivisionWeather = "/data/subdivisions_weather.csv",
}

export const enum MapType {
  Countries = "/data/countries.geo.json",
  Subdivisions = "/data/subdivisions.geo.json",
  Ethnicities = "/data/greg.geojson",
}
