import type { WeatherData, HourlyData, DailyData } from '../types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: [
      'temperature_2m',
      'surface_pressure',
      'precipitation',
      'precipitation_probability',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'weather_code',
    ].join(','),
    current: [
      'temperature_2m',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'precipitation',
      'relative_humidity_2m',
      'weather_code',
      'is_day',
    ].join(','),
    timezone: 'Asia/Shanghai',
    forecast_days: '7',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`天气API错误: ${res.status}`);

  const data = await res.json();

  const current = {
    temperature: data.current.temperature_2m,
    pressure: data.current.surface_pressure,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    cloudCover: data.current.cloud_cover,
    precipitation: data.current.precipitation,
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
  };

  const hourly: HourlyData = {
    time: data.hourly.time,
    temperature: data.hourly.temperature_2m,
    pressure: data.hourly.surface_pressure,
    precipitation: data.hourly.precipitation,
    precipitationProbability: data.hourly.precipitation_probability,
    windSpeed: data.hourly.wind_speed_10m,
    windDirection: data.hourly.wind_direction_10m,
    cloudCover: data.hourly.cloud_cover,
  };

  const daily: DailyData = {
    time: data.daily.time,
    tempMax: data.daily.temperature_2m_max,
    tempMin: data.daily.temperature_2m_min,
    sunrise: data.daily.sunrise,
    sunset: data.daily.sunset,
    precipitationSum: data.daily.precipitation_sum,
    weatherCode: data.daily.weather_code,
  };

  return { current, hourly, daily };
}

export async function searchLocation(query: string): Promise<{ name: string; lat: number; lon: number; admin?: string }[]> {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'zh',
    format: 'json',
  });
  const res = await fetch(`${GEOCODING_URL}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: any) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    admin: r.admin1 || r.country || '',
  }));
}

// WMO 天气码 → 中文描述 + 图标
const WMO_CODES: Record<number, { text: string; icon: string }> = {
  0: { text: '晴', icon: '☀️' },
  1: { text: '晴间多云', icon: '🌤️' },
  2: { text: '多云', icon: '⛅' },
  3: { text: '阴', icon: '☁️' },
  45: { text: '雾', icon: '🌫️' },
  48: { text: '雾凇', icon: '🌫️' },
  51: { text: '毛毛雨', icon: '🌦️' },
  53: { text: '小雨', icon: '🌦️' },
  55: { text: '中雨', icon: '🌧️' },
  56: { text: '冻雨', icon: '🌧️' },
  57: { text: '强冻雨', icon: '🌧️' },
  61: { text: '小雨', icon: '🌧️' },
  63: { text: '中雨', icon: '🌧️' },
  65: { text: '大雨', icon: '🌧️' },
  66: { text: '冻雨', icon: '🌧️' },
  67: { text: '强冻雨', icon: '🌧️' },
  71: { text: '小雪', icon: '🌨️' },
  73: { text: '中雪', icon: '🌨️' },
  75: { text: '大雪', icon: '❄️' },
  77: { text: '霰', icon: '🌨️' },
  80: { text: '阵雨', icon: '🌦️' },
  81: { text: '强阵雨', icon: '🌧️' },
  82: { text: '暴雨', icon: '⛈️' },
  85: { text: '阵雪', icon: '🌨️' },
  86: { text: '强阵雪', icon: '❄️' },
  95: { text: '雷暴', icon: '⛈️' },
  96: { text: '雷暴冰雹', icon: '⛈️' },
  99: { text: '强雷暴', icon: '⛈️' },
};

export function wmoToText(code: number): string {
  return WMO_CODES[code]?.text ?? '未知';
}

export function wmoToIcon(code: number): string {
  return WMO_CODES[code]?.icon ?? '❓';
}

// 风向度数 → 中文方位
const WIND_DIRS = ['北', '东北偏北', '东北', '东北偏东', '东', '东南偏东', '东南', '东南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北'];
export function windDirText(deg: number): string {
  const idx = Math.round(deg / 22.5) % 16;
  return WIND_DIRS[idx];
}

// m/s → 蒲福风级
export function windToBeaufort(speedMs: number): number {
  const table = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
  for (let i = 0; i < table.length; i++) {
    if (speedMs < table[i]) return i;
  }
  return 12;
}

// 获取最近24小时的气压趋势数据
export function getPressureTrend(hourly: HourlyData, nowIdx: number): { times: string[]; values: number[] } {
  const start = Math.max(0, nowIdx - 12);
  const end = Math.min(hourly.pressure.length, nowIdx + 13);
  return {
    times: hourly.time.slice(start, end),
    values: hourly.pressure.slice(start, end),
  };
}
