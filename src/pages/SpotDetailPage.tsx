import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Droplets, Wind, Thermometer, Gauge, Plus } from 'lucide-react';
import type { Spot, WeatherData, FishingScore } from '../types';
import { fetchWeather, wmoToIcon, wmoToText, windDirText, windToBeaufort, getPressureTrend } from '../lib/weather';
import { calculateFishingScore, calculateDailyScore } from '../lib/fishing';
import PressureChart from '../components/PressureChart';
import ScoreCircle from '../components/ScoreCircle';

interface Props {
  spot: Spot;
  onBack: () => void;
  onAddLog: (spot: Spot, score: FishingScore | null) => void;
}

export default function SpotDetailPage({ spot, onBack, onAddLog }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [score, setScore] = useState<FishingScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const w = await fetchWeather(spot.latitude, spot.longitude);
        if (cancelled) return;
        setWeather(w);
        setScore(calculateFishingScore(w));
      } catch (e: any) {
        if (!cancelled) setError(e.message || '获取天气数据失败');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [spot.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100">
        <Loader2 size={32} className="animate-spin text-water-500" />
        <p className="text-gray-400 text-sm">正在获取 {spot.name} 的天气数据...</p>
      </div>
    );
  }

  if (error || !weather || !score) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100 px-6">
        <p className="text-red-400 text-center">{error || '数据获取失败'}</p>
        <button onClick={onBack} className="text-water-600 font-medium">返回</button>
      </div>
    );
  }

  // 气压趋势数据
  const nowIdx = weather.hourly.time.findIndex(t =>
    new Date(t).getHours() === new Date().getHours() &&
    new Date(t).getDate() === new Date().getDate()
  );
  const trendData = getPressureTrend(weather.hourly, Math.max(0, nowIdx));
  const trendLabels = trendData.times.map(t => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  });

  // 逐时预报（未来12小时）
  const hourlyItems = [];
  for (let i = Math.max(0, nowIdx); i < Math.min(weather.hourly.time.length, nowIdx + 12); i++) {
    hourlyItems.push({
      time: new Date(weather.hourly.time[i]),
      temp: weather.hourly.temperature[i],
      precip: weather.hourly.precipitation[i],
      precipProb: weather.hourly.precipitationProbability[i],
      windSpeed: weather.hourly.windSpeed[i],
      weatherCode: weather.current.weatherCode,
      icon: wmoToIcon(weather.current.weatherCode),
    });
  }

  // 7天预报
  const dailyItems = weather.daily.time.map((date, i) => {
    // 计算每日钓鱼指数（简化版）
    let dailyPressure = null;
    let prevPressure = null;
    // 取当天中间点的气压作为均值
    const dayHourIdx = weather.hourly.time.findIndex(t => t.startsWith(date));
    if (dayHourIdx >= 0) {
      dailyPressure = weather.hourly.pressure[dayHourIdx + 12] || weather.hourly.pressure[dayHourIdx];
      if (i > 0) {
        const prevIdx = weather.hourly.time.findIndex(t => t.startsWith(weather.daily.time[i - 1]));
        if (prevIdx >= 0) prevPressure = weather.hourly.pressure[prevIdx + 12];
      }
    }
    const dscore = calculateDailyScore(
      weather.daily.tempMax[i],
      weather.daily.tempMin[i],
      weather.daily.precipitationSum[i],
      weather.daily.weatherCode[i],
      dailyPressure ?? undefined,
      prevPressure ?? undefined,
    );
    return {
      date: new Date(date),
      tempMax: weather.daily.tempMax[i],
      tempMin: weather.daily.tempMin[i],
      precipSum: weather.daily.precipitationSum[i],
      weatherCode: weather.daily.weatherCode[i],
      score: dscore,
    };
  });

  const c = weather.current;
  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="min-h-screen pb-20 bg-slate-100 page-transition">
      {/* 顶部栏 */}
      <header className="bg-gradient-to-br from-water-600 to-water-800 text-white px-4 pt-12 pb-6 sticky top-0 z-40">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{spot.name}</h1>
            <p className="text-water-200 text-xs">
              {spot.latitude.toFixed(3)}°N, {spot.longitude.toFixed(3)}°E · {spot.type === 'freshwater' ? '淡水' : '海水'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-4 -mt-2">
        {/* 钓鱼指数 */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">🎣 钓鱼指数</h2>
          <ScoreCircle score={score} />

          {/* 因子分解 */}
          <div className="mt-6 space-y-2">
            {score.factors.map(f => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{f.name}</span>
                    <span className="text-xs font-semibold" style={{
                      color: f.score >= 70 ? '#16a34a' : f.score >= 45 ? '#ca8a04' : '#dc2626'
                    }}>
                      {f.score}/100
                    </span>
                  </div>
                  {/* 进度条 */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${f.score}%`,
                        backgroundColor: f.score >= 70 ? '#22c55e' : f.score >= 45 ? '#eab308' : '#ef4444'
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 当前天气 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">🌤️ 当前天气</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{wmoToIcon(c.weatherCode)}</span>
            <div>
              <div className="text-4xl font-bold text-gray-800">{c.temperature.toFixed(0)}°C</div>
              <div className="text-gray-400 text-sm">{wmoToText(c.weatherCode)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<Gauge size={18} />} label="气压" value={`${c.pressure.toFixed(0)} hPa`} />
            <InfoCard icon={<Wind size={18} />} label="风力" value={`${windToBeaufort(c.windSpeed)}级 ${windDirText(c.windDirection)}`} />
            <InfoCard icon={<Droplets size={18} />} label="湿度" value={`${c.humidity}%`} />
            <InfoCard icon={<Thermometer size={18} />} label="降水" value={`${c.precipitation.toFixed(1)} mm`} />
          </div>
        </section>

        {/* 气压趋势 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">📊 气压趋势（近12h ~ 未来12h）</h2>
          <p className="text-xs text-gray-300 mb-3">气压变化比绝对值更重要。缓慢下降时鱼最活跃。</p>
          <PressureChart values={trendData.values} labels={trendLabels} />
        </section>

        {/* 逐时预报 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">🕐 未来12小时</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {hourlyItems.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[52px]">
                <span className="text-xs text-gray-400">
                  {i === 0 ? '现在' : `${h.time.getHours()}时`}
                </span>
                <span className="text-2xl">{h.icon}</span>
                <span className="font-semibold text-gray-800 text-sm">{h.temp.toFixed(0)}°</span>
                <span className="text-xs text-blue-400">{h.precipProb > 0 ? `${h.precipProb}%` : ''}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7天预报 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">📅 7天钓鱼指数</h2>
          <div className="space-y-2">
            {dailyItems.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-14">
                  <div className="font-medium text-gray-700 text-sm">
                    {i === 0 ? '今天' : `周${dayLabels[d.date.getDay()]}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {d.date.getMonth() + 1}/{d.date.getDate()}
                  </div>
                </div>
                <span className="text-xl">{wmoToIcon(d.weatherCode)}</span>
                <div className="flex-1 text-sm text-gray-500">
                  {d.tempMin.toFixed(0)}~{d.tempMax.toFixed(0)}°
                  {d.precipSum > 0 && <span className="text-blue-400 ml-1">{d.precipSum.toFixed(0)}mm</span>}
                </div>
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm"
                  style={{
                    backgroundColor: d.score >= 65 ? '#16a34a' : d.score >= 45 ? '#ca8a04' : '#dc2626'
                  }}
                >
                  {d.score}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 记录渔获 */}
        <button
          onClick={() => onAddLog(spot, score)}
          className="w-full bg-water-600 text-white py-3.5 rounded-2xl font-medium hover:bg-water-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          记录今日渔获
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-semibold text-gray-700">{value}</div>
      </div>
    </div>
  );
}
