import { storage } from 'wxt/utils/storage';

/** Where the weather comes from — set once, keyless, no geolocation. */
export interface WeatherConfig {
  city: string;
  /** "Maharashtra, India" as shown under the degrees */
  label: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCache {
  temp: number;
  code: number;
  ts: number;
}

export const weatherItem = storage.defineItem<WeatherConfig | null>(
  'local:weather',
  { fallback: null },
);

export const weatherCacheItem = storage.defineItem<WeatherCache | null>(
  'local:weatherCache',
  { fallback: null },
);

/** Half an hour of calm before asking the sky again. */
export const WEATHER_TTL_MS = 30 * 60_000;
