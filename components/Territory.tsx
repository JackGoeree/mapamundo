// Country.ts
export class Territory {
  name: string;
  valueMetrics: Record<string, number>;
  weatherMetrics: Record<string, number>;

  constructor(name: string) {
    this.name = name;
    this.valueMetrics = {};
    this.weatherMetrics = {};
  }

  setCountryMetric(key: string, value: number) {
    this.valueMetrics[key] = value;
  }

  setWeatherMetric(key: string, value: number) {
    this.weatherMetrics[key] = value;
  }

  getMetric(key: string): number | null {
    if (key in this.valueMetrics) return this.valueMetrics[key];
    if (key in this.weatherMetrics) return this.weatherMetrics[key];
    return null;
  }
}
