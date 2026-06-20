import type { WeatherData, FishingScore, ScoreFactor } from '../types';
import { windToBeaufort, windDirText, wmoToText } from './weather';

/**
 * 钓鱼指数算法
 *
 * 基于中国传统钓鱼经验，综合以下因子：
 * 1. 气压趋势 (35%) - 鱼类对气压变化敏感，趋势比绝对值更重要
 * 2. 风向风力 (20%) - 微风好钓，大风不钓；东北风为最佳
 * 3. 温度适宜度 (15%) - 鱼类有最适水温区间
 * 4. 降水/天气 (15%) - 小雨增加溶氧，大雨搅浑水
 * 5. 云量光照 (15%) - 阴天散射光，鱼更敢出来觅食
 */

export function calculateFishingScore(weather: WeatherData): FishingScore {
  const { current, hourly } = weather;

  // === 1. 气压评分 ===
  const pressureScore = scorePressure(current.pressure, hourly.pressure, getCurrentHourIndex(hourly.time));

  // === 2. 风力风向评分 ===
  const windScore = scoreWind(current.windSpeed, current.windDirection);

  // === 3. 温度评分 ===
  const tempScore = scoreTemperature(current.temperature, hourly.temperature, getCurrentHourIndex(hourly.time));

  // === 4. 降水/天气评分 ===
  const rainScore = scorePrecipitation(current.precipitation, current.weatherCode);

  // === 5. 云量评分 ===
  const cloudScore = scoreCloudCover(current.cloudCover);

  const factors: ScoreFactor[] = [
    pressureScore,
    windScore,
    tempScore,
    rainScore,
    cloudScore,
  ];

  const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  const level = getLevel(total);
  const advice = getAdvice(level, factors);

  return {
    total,
    level: level,
    label: LEVEL_INFO[level].label,
    color: LEVEL_INFO[level].color,
    factors,
    advice,
  };
}

function getCurrentHourIndex(times: string[]): number {
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 13); // "2026-06-21T14"
  for (let i = 0; i < times.length; i++) {
    if (times[i].slice(0, 13) === nowStr) return i;
  }
  return 0;
}

function scorePressure(currentPressure: number, pressures: number[], nowIdx: number): ScoreFactor {
  let score = 60;
  let detail = '';

  // 气压趋势：取过去6小时变化
  const pastIdx = Math.max(0, nowIdx - 6);
  const trend = currentPressure - (pressures[pastIdx] ?? currentPressure);

  // 绝对值区间
  if (currentPressure < 990) {
    score -= 25;
    detail += '气压极低，水中溶氧不足';
  } else if (currentPressure > 1030) {
    score -= 15;
    detail += '气压偏高';
  } else {
    score += 10;
    detail += '气压在正常区间';
  }

  // 趋势评分
  if (trend >= -1 && trend <= 1) {
    score += 20;
    detail += '，气压稳定，鱼情正常';
  } else if (trend < -1 && trend >= -3) {
    score += 25;
    detail += '，气压缓慢下降，鱼类活跃觅食';
  } else if (trend < -3 && trend >= -5) {
    score += 5;
    detail += '，气压下降较快，鱼可能浮头';
  } else if (trend < -5) {
    score -= 15;
    detail += '，气压骤降，鱼极度不适应';
  } else if (trend > 1 && trend <= 3) {
    score += 20;
    detail += '，气压回升，鱼情转好';
  } else if (trend > 3 && trend <= 5) {
    score += 5;
    detail += '，气压快速回升，需观察';
  } else {
    score -= 10;
    detail += '，气压骤升，鱼需适应';
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: '气压',
    score,
    weight: 0.35,
    detail: `${detail}（当前 ${Math.round(currentPressure)} hPa，6h变化 ${trend > 0 ? '+' : ''}${trend.toFixed(1)}）`,
    icon: '🌡️',
  };
}

function scoreWind(speedMs: number, direction: number): ScoreFactor {
  const beaufort = windToBeaufort(speedMs);
  const dirText = windDirText(direction);
  let score = 50;
  let detail = `${dirText}风 ${beaufort}级（${speedMs.toFixed(1)} m/s）`;

  // 风力评分
  if (beaufort >= 1 && beaufort <= 3) {
    score = 90;
    detail += '，微风轻浪，水中溶氧充足';
  } else if (beaufort === 0) {
    score = 55;
    detail += '，无风闷热，溶氧偏低';
  } else if (beaufort === 4) {
    score = 60;
    detail += '，风稍大，需加重铅坠';
  } else if (beaufort >= 5) {
    score = 20;
    detail += '，风大浪急，不宜出钓';
  }

  // 风向加成（中国传统钓经验）
  const dir = direction;
  // 东北风 (22.5°-67.5°) 最佳
  if (dir >= 22.5 && dir < 67.5) {
    score += 10;
    detail += '。东北风为最佳钓风';
  }
  // 西南风 (202.5°-247.5°) 最差
  else if (dir >= 202.5 && dir < 247.5) {
    score -= 10;
    detail += '。西南风不利钓鱼';
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: '风力风向',
    score,
    weight: 0.20,
    detail,
    icon: '💨',
  };
}

function scoreTemperature(temp: number, temps: number[], nowIdx: number): ScoreFactor {
  let score = 50;
  let detail = `当前 ${temp.toFixed(0)}°C`;

  // 最适温度区间
  if (temp >= 18 && temp <= 28) {
    score = 90;
    detail += '，温度适宜';
  } else if (temp >= 10 && temp < 18) {
    score = 65;
    detail += '，温度偏凉';
  } else if (temp > 28 && temp <= 32) {
    score = 55;
    detail += '，温度偏热';
  } else if (temp >= 5 && temp < 10) {
    score = 40;
    detail += '，温度较低，鱼活性下降';
  } else if (temp < 5) {
    score = 20;
    detail += '，温度过低，多数鱼不觅食';
  } else {
    score = 25;
    detail += '，温度过高，鱼躲深水';
  }

  // 24小时温差变化
  const pastIdx = Math.max(0, nowIdx - 24);
  const tempChange = Math.abs(temp - (temps[pastIdx] ?? temp));
  if (tempChange > 6) {
    score -= 15;
    detail += `，24h温差${tempChange.toFixed(0)}°C过大，鱼需适应`;
  } else if (tempChange <= 3) {
    score += 5;
    detail += `，温度稳定`;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: '温度',
    score,
    weight: 0.15,
    detail,
    icon: '🌡️',
  };
}

function scorePrecipitation(precip: number, weatherCode: number): ScoreFactor {
  let score = 55;
  let detail = '';

  // WMO weather_code 判断天气类型
  const text = wmoToText(weatherCode);

  if (precip === 0 && weatherCode <= 2) {
    score = 55;
    detail = `晴好天气（${text}），光照强鱼偏谨慎`;
  } else if (precip === 0 && (weatherCode === 3 || weatherCode >= 45 && weatherCode <= 48)) {
    score = 75;
    detail = `阴天/雾天（${text}），散射光有利觅食`;
  } else if (precip > 0 && precip <= 2.5) {
    score = 85;
    detail = `${text}，小雨增加溶氧和食物，鱼活跃`;
  } else if (precip > 2.5 && precip <= 8) {
    score = 55;
    detail = `${text}，雨势中等，鱼情一般`;
  } else if (precip > 8) {
    score = 25;
    detail = `${text}，大雨搅浑水质，不宜垂钓`;
  } else {
    score = 60;
    detail = `${text}`;
  }

  // 雷暴天气一律降分
  if (weatherCode >= 95) {
    score = 10;
    detail = '雷暴天气，严禁出钓（安全第一）';
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: '天气降水',
    score,
    weight: 0.15,
    detail,
    icon: '🌧️',
  };
}

function scoreCloudCover(cloud: number): ScoreFactor {
  let score = 50;
  let detail = `${cloud}% 云量`;

  if (cloud >= 80) {
    score = 85;
    detail += '，阴天，散射光鱼更敢觅食';
  } else if (cloud >= 40) {
    score = 70;
    detail += '，多云，条件不错';
  } else if (cloud >= 10) {
    score = 55;
    detail += '，少云';
  } else {
    score = 40;
    detail += '，晴空万里，光线强鱼偏深水';
  }

  return {
    name: '云量光照',
    score,
    weight: 0.15,
    detail,
    icon: '☁️',
  };
}

// ==================== 等级和建议 ====================

const LEVEL_INFO = {
  excellent: { label: '极佳', color: '#16a34a' },
  good: { label: '适宜', color: '#65a30d' },
  fair: { label: '一般', color: '#ca8a04' },
  poor: { label: '不佳', color: '#dc2626' },
} as const;

function getLevel(total: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (total >= 80) return 'excellent';
  if (total >= 65) return 'good';
  if (total >= 45) return 'fair';
  return 'poor';
}

function getAdvice(level: string, factors: ScoreFactor[]): string {
  const worst = [...factors].sort((a, b) => a.score - b.score)[0];

  switch (level) {
    case 'excellent':
      return `天时不错！${worst.score < 60 ? `注意${worst.name}稍弱` : '各条件俱佳'}，收拾装备出发吧！`;
    case 'good':
      return `整体适宜出钓。${worst.score < 50 ? `但${worst.name}不太理想，注意调整策略。` : '可以放心去钓。'}`;
    case 'fair':
      return `条件一般。${worst.score < 40 ? `${worst.name}是主要短板。` : ''}可钓但别期望太高，建议选合适时段。`;
    case 'poor':
      return `今天不太适合出钓。${worst.detail}。建议改日或等条件改善。`;
    default:
      return '';
  }
}

// 每日钓鱼指数（简化版，基于日数据）
export function calculateDailyScore(
  tempMax: number,
  tempMin: number,
  precipSum: number,
  weatherCode: number,
  avgPressure?: number,
  prevPressure?: number,
): number {
  let score = 50;

  // 温度区间
  const avgTemp = (tempMax + tempMin) / 2;
  if (avgTemp >= 18 && avgTemp <= 28) score += 15;
  else if (avgTemp >= 10 && avgTemp <= 32) score += 5;
  else score -= 10;

  // 降水
  if (precipSum > 0 && precipSum <= 10) score += 10;
  else if (precipSum > 10 && precipSum <= 25) score -= 5;
  else if (precipSum > 25) score -= 20;

  // 天气类型
  if (weatherCode === 3 || (weatherCode >= 45 && weatherCode <= 48)) score += 10;
  if (weatherCode >= 95) score = 10;

  // 气压趋势
  if (avgPressure && prevPressure) {
    const trend = avgPressure - prevPressure;
    if (trend >= -2 && trend <= 0) score += 10;
    else if (trend > 0 && trend <= 2) score += 8;
    else if (trend < -3) score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
