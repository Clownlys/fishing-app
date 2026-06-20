import { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Trash2 } from 'lucide-react';
import type { Spot, WeatherData, FishingScore } from '../types';
import { getSpots, deleteSpot } from '../lib/storage';
import { fetchWeather, wmoToIcon, wmoToText, windDirText, windToBeaufort } from '../lib/weather';
import { calculateFishingScore } from '../lib/fishing';

interface Props {
  onSelectSpot: (spot: Spot) => void;
  onAddSpot: () => void;
  refreshKey: number;
}

interface SpotWeather {
  weather: WeatherData;
  score: FishingScore;
}

export default function HomePage({ onSelectSpot, onAddSpot, refreshKey }: Props) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, SpotWeather>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSpots(getSpots());
  }, [refreshKey]);

  useEffect(() => {
    if (spots.length === 0) return;
    spots.forEach(async (spot) => {
      if (weatherMap[spot.id]) return;
      setLoading(prev => new Set(prev).add(spot.id));
      try {
        const weather = await fetchWeather(spot.latitude, spot.longitude);
        const score = calculateFishingScore(weather);
        setWeatherMap(prev => ({ ...prev, [spot.id]: { weather, score } }));
      } catch (e) {
        console.error('天气获取失败:', spot.name, e);
      }
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(spot.id);
        return next;
      });
    });
  }, [spots]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除这个钓点？相关渔获记录不会被删除。')) {
      deleteSpot(id);
      setSpots(getSpots());
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-100">
      {/* 头部 */}
      <header className="bg-gradient-to-br from-water-600 to-water-800 text-white px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold">🎣 鱼讯</h1>
        <p className="text-water-100 text-sm mt-1">你的私人钓鱼天气助手</p>
      </header>

      {/* 钓点列表 */}
      <div className="max-w-md mx-auto px-4 -mt-4">
        {spots.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">📍</div>
            <h2 className="text-lg font-semibold text-gray-700">还没有钓点</h2>
            <p className="text-gray-400 text-sm mt-1 mb-4">添加你常去的钓鱼位置</p>
            <button
              onClick={onAddSpot}
              className="bg-water-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-water-700 transition-colors"
            >
              添加第一个钓点
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {spots.map(spot => {
              const w = weatherMap[spot.id];
              const isLoading = loading.has(spot.id);
              return (
                <div
                  key={spot.id}
                  onClick={() => onSelectSpot(spot)}
                  className="bg-white rounded-2xl shadow-sm p-4 active:scale-[0.98] transition-transform cursor-pointer relative"
                >
                  <button
                    onClick={(e) => handleDelete(spot.id, e)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 p-1"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={18} className="text-water-500" />
                    <h3 className="font-semibold text-gray-800 text-lg">{spot.name}</h3>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Loader2 size={16} className="animate-spin" />
                      正在获取天气数据...
                    </div>
                  ) : w ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 天气 */}
                        <div className="flex items-center gap-1">
                          <span className="text-3xl">{wmoToIcon(w.weather.current.weatherCode)}</span>
                          <div>
                            <div className="text-2xl font-bold text-gray-800">
                              {w.weather.current.temperature.toFixed(0)}°
                            </div>
                            <div className="text-xs text-gray-400">
                              {wmoToText(w.weather.current.weatherCode)}
                            </div>
                          </div>
                        </div>

                        {/* 气压 */}
                        <div className="border-l border-gray-100 pl-3">
                          <div className="text-xs text-gray-400">气压</div>
                          <div className="font-semibold text-gray-700">
                            {w.weather.current.pressure.toFixed(0)} <span className="text-xs text-gray-400">hPa</span>
                          </div>
                        </div>

                        {/* 风力 */}
                        <div className="border-l border-gray-100 pl-3">
                          <div className="text-xs text-gray-400">风力</div>
                          <div className="font-semibold text-gray-700">
                            {windToBeaufort(w.weather.current.windSpeed)}<span className="text-xs text-gray-400">级</span>
                          </div>
                        </div>
                      </div>

                      {/* 钓鱼指数 */}
                      <div className="text-right">
                        <div
                          className="inline-flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-xl"
                          style={{ backgroundColor: w.score.color }}
                        >
                          {w.score.total}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: w.score.color }}>
                          {w.score.label}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm py-4">
                      天气数据获取失败，点击重试
                    </div>
                  )}
                </div>
              );
            })}

            {/* 添加钓点按钮 */}
            <button
              onClick={onAddSpot}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-400 hover:border-water-400 hover:text-water-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span className="font-medium">添加钓点</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
