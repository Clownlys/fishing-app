// ==================== 钓点 ====================
export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'freshwater' | 'saltwater';
  createdAt: string;
}

// ==================== 天气数据 ====================
export interface WeatherData {
  current: {
    temperature: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    cloudCover: number;
    precipitation: number;
    humidity: number;
    weatherCode: number;
    isDay: boolean;
  };
  hourly: HourlyData;
  daily: DailyData;
}

export interface HourlyData {
  time: string[];
  temperature: number[];
  pressure: number[];
  precipitation: number[];
  precipitationProbability: number[];
  windSpeed: number[];
  windDirection: number[];
  cloudCover: number[];
}

export interface DailyData {
  time: string[];
  tempMax: number[];
  tempMin: number[];
  sunrise: string[];
  sunset: string[];
  precipitationSum: number[];
  weatherCode: number[];
}

// ==================== 钓鱼指数 ====================
export interface ScoreFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
  icon: string;
}

export interface FishingScore {
  total: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
  factors: ScoreFactor[];
  advice: string;
}

// ==================== 钓鱼日志 ====================
export interface LogEntry {
  id: string;
  spotId: string;
  spotName: string;
  date: string;
  fishType: string;
  count: number;
  totalWeight: string;
  notes: string;
  weatherSummary: string;
  score: number | null;
  createdAt: string;
}
