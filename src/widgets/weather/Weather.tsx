import { useEffect, useRef, useState } from 'react';
import {
  weatherItem,
  weatherCacheItem,
  WEATHER_TTL_MS,
  type WeatherConfig,
  type WeatherCache,
} from './item';
import { wmoLabel, buildGeocodeUrl, buildForecastUrl } from './codes';
import { useStorageValue } from '../../state/useStorageValue';

interface GeocodeReply {
  results?: Array<{
    name?: string;
    admin1?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

interface ForecastReply {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
}

/** Opt-in, city-typed-once, keyless. Never nagging, never tracking. */
export function Weather() {
  const config = useStorageValue(weatherItem) as WeatherConfig | null;
  const cache = useStorageValue(weatherCacheItem) as WeatherCache | null;
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState('');
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (!config) return;
    if (cache && Date.now() - cache.ts < WEATHER_TTL_MS) return;
    if (busy.current) return;
    busy.current = true;
    void (async () => {
      try {
        const res = await fetch(buildForecastUrl(config.latitude, config.longitude));
        const data = (await res.json()) as ForecastReply;
        const { temperature_2m: temp, weather_code: code } = data.current ?? {};
        if (typeof temp === 'number' && typeof code === 'number') {
          void weatherCacheItem.setValue({ temp, code, ts: Date.now() });
        }
      } catch {
        /* offline stays quiet */
      } finally {
        busy.current = false;
      }
    })();
  }, [config?.latitude, config?.longitude, config, cache?.ts, cache]);

  const add = async () => {
    const name = city.trim();
    if (!name) return;
    try {
      const res = await fetch(buildGeocodeUrl(name));
      const data = (await res.json()) as GeocodeReply;
      const r = data.results?.[0];
      if (!r || typeof r.latitude !== 'number' || typeof r.longitude !== 'number') {
        setFailed(true);
        return;
      }
      await weatherItem.setValue({
        city: r.name ?? name,
        label: [r.admin1, r.country].filter(Boolean).join(', '),
        latitude: r.latitude,
        longitude: r.longitude,
      });
      setEditing(false);
      setCity('');
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="widget" aria-label="Weather">
      <p className="widget-label">Weather</p>
      {config && cache && (
        <p className="weather-line">
          <span className="weather-temp tnum">{Math.round(cache.temp)}°</span>{' '}
          <span className="weather-cond">{wmoLabel(cache.code)}</span>
          <span className="weather-city">{config.city}</span>
        </p>
      )}
      {config === null && !editing && (
        <button
          type="button"
          className="widget-trigger"
          onClick={() => setEditing(true)}
        >
          ＋ add weather
        </button>
      )}
      {editing && (
        <form
          className="weather-form"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <input
            className="widget-input"
            type="text"
            autoComplete="off"
            autoFocus
            placeholder={failed ? 'City not found' : 'City name'}
            aria-label="City name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditing(false);
                setFailed(false);
              }
            }}
          />
        </form>
      )}
    </section>
  );
}
