import { describe, expect, it } from 'vitest';
import { wmoLabel, buildGeocodeUrl, buildForecastUrl } from './codes';

describe('wmoLabel', () => {
  it('speaks plainly about common codes', () => {
    expect(wmoLabel(0)).toBe('clear');
    expect(wmoLabel(2)).toBe('partly cloudy');
    expect(wmoLabel(3)).toBe('overcast');
    expect(wmoLabel(51)).toBe('light rain');
    expect(wmoLabel(65)).toBe('heavy rain');
    expect(wmoLabel(71)).toBe('snow');
    expect(wmoLabel(95)).toBe('storm');
  });

  it('answers unknown codes with a shrug', () => {
    expect(wmoLabel(999)).toBe('cloudy');
  });
});

describe('buildGeocodeUrl', () => {
  it('points at open-meteo with the encoded city', () => {
    expect(buildGeocodeUrl('pune')).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=pune&count=1&language=en&format=json',
    );
    expect(buildGeocodeUrl('st. paul')).toContain('name=st.%20paul');
  });
});

describe('buildForecastUrl', () => {
  it('asks only for today, keyless', () => {
    const url = new URL(buildForecastUrl(52.52, 13.41));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.pathname).toBe('/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('52.52');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code');
  });
});
