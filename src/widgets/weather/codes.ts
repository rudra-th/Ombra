/** WMO weather-code → one plain word, in Ombra's voice. */
export function wmoLabel(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1) return 'mostly clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 64) return 'light rain';
  if (code === 65 || code === 67) return 'heavy rain';
  if (code === 66) return 'freezing rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code === 85 || code === 86) return 'snow showers';
  if (code >= 95 && code <= 99) return 'storm';
  return 'cloudy'; // a shrug, never an error message
}

/** Keyless geocoding — city typed once, no geolocation ever. */
export function buildGeocodeUrl(city: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city,
  )}&count=1&language=en&format=json`;
}

/** Today only, timezone from lat/lon — the API stays keyless. */
export function buildForecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}
