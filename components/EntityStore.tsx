/* eslint-disable @typescript-eslint/no-explicit-any */
// EntityStore.ts
import { MetricKey, Metrics } from "./Enums";

export type EntityId = string; // "DE" or "DE:Brandenburg"

export type EntityMetrics = Partial<Record<MetricKey, number>>;

export type EntityValues = {
  id: EntityId;
  metrics: EntityMetrics;
  fallback: Set<MetricKey>;
};

export type EntityStore = Map<EntityId, EntityValues>;

export function getEntity(store: EntityStore, id: EntityId): EntityValues {
  let entity = store.get(id);
  if (!entity) {
    entity = { id, metrics: {}, fallback: new Set() };
    store.set(id, entity);
  }
  return entity;
}

import { Metric } from "./Enums";

export function ingestCountryRow(store: EntityStore, row: any[]) {
  const iso3 = row[1];
  if (!/^[A-Z]{3}$/.test(iso3)) return;

  if (iso3 == "KAZ") {
    console.log("Kaz");
  }

  const entity = getEntity(store, iso3);

  for (const metricKey of Metrics) {
    const col = Metric[metricKey].column;
    const value = parseFloat(row[col]);
    if (!isNaN(value)) {
      entity.metrics[metricKey] = value;
    }
  }
  if (iso3 == "KAZ") {
    console.log(entity);
  }
}

export function ingestSubdivisionRow(store: EntityStore, row: any[]) {
  const name = row[0];
  const code = row[1]; // e.g. "DE.1"
  if (!code?.includes(".")) return;

  const iso3 = code.split(".")[0];
  const id = `${iso3}:${name}`;
  const entity = getEntity(store, id);

  for (const metricKey of Metrics) {
    const col = Metric[metricKey].column;
    const value = parseFloat(row[col]);
    if (!isNaN(value)) {
      entity.metrics[metricKey] = value;
    }
  }
}

export function applyNationalFallbacks(store: EntityStore) {
  for (const [id, entity] of store) {
    if (!id.includes(":")) continue;

    const iso3 = id.split(":")[0];
    if (iso3 == "KAZ") {
      console.log(entity);
    }

    const country = store.get(iso3);
    if (!country) continue;

    for (const key in country.metrics) {
      const metricKey = key as MetricKey;

      if (entity.metrics[metricKey] === undefined) {
        entity.metrics[metricKey] = country.metrics[metricKey];
        entity.fallback.add(metricKey);
      }
    }
    if (iso3 == "KAZ") {
      console.log(entity);
    }
  }
}
